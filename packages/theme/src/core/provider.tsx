import type { JSX, ReactNode } from "react";
import {
  startTransition,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useOptimistic,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { DEFAULT_RESOLVED_COLOR_SCHEME, DEFAULT_COLOR_SCHEME, MEDIA, STORAGE_KEY, SYNC_CHANNEL } from "#/constants";
import { ColorSchemeContext } from "#/core/context";
import type { ResolvedColorScheme, ColorScheme, ColorSchemeContextType } from "#/types";
import { colorSchemeSchema } from "#/types";
import { applyColorScheme, suppressTransitions } from "#/utils/dom";
import { getSystemColorScheme } from "#/utils/system";

/* -----------------------------------------------------------------------------
 * System Color Scheme Subscription
 *
 * These functions power `useSyncExternalStore` for reactive system color scheme detection.
 * This pattern ensures SSR safety and efficient re-renders on OS preference changes.
 * -------------------------------------------------------------------------- */

/**
 * Subscribe to OS color scheme preference changes.
 *
 * @param callback - Function to call when system color scheme changes
 * @returns Cleanup function to remove the listener
 */
function subscribeToSystemColorScheme(callback: () => void): () => void {
  const mediaQuery = window.matchMedia(MEDIA);

  mediaQuery.addEventListener("change", callback);

  return () => {
    mediaQuery.removeEventListener("change", callback);
  };
}

/** SSR has no `matchMedia`; render the default until the first client snapshot takes over. */
function getServerSnapshot(): ResolvedColorScheme {
  return DEFAULT_RESOLVED_COLOR_SCHEME;
}

/**
 * Safely create a color scheme BroadcastChannel when supported by the environment.
 */
function createColorSchemeChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") {
    return null;
  }

  try {
    return new BroadcastChannel(SYNC_CHANNEL);
  } catch {
    return null;
  }
}

/**
 * Read + validate the persisted preference from localStorage. Returns null when unavailable
 * (SSR, private mode) or when the stored value is not a recognised scheme.
 */
function readColorSchemeFromStorage(storageKey: string): ColorScheme | null {
  if (typeof globalThis.window === "undefined") {
    return null;
  }

  try {
    const result = colorSchemeSchema.safeParse(globalThis.window.localStorage.getItem(storageKey));

    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/* -----------------------------------------------------------------------------
 * Props
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.3
 */
export type AppearanceProviderProps = {
  readonly children: ReactNode;
  /**
   * When true, temporarily suppresses CSS transitions during color scheme changes.
   * Prevents jarring color animations when switching appearances.
   * Default: false
   */
  readonly disableTransition?: boolean;
  /**
   * CSP nonce for inline styles when `disableTransition` is enabled.
   */
  readonly nonce?: string;
  /**
   * Custom async persistence for color scheme changes; replaces the `localStorage` auto-persist.
   */
  readonly persistColorScheme?: (value: ColorScheme) => Promise<void>;
  /**
   * Callback invoked when `persistColorScheme` rejects.
   */
  readonly onPersistError?: (error: unknown, attemptedColorScheme: ColorScheme) => void;
  /**
   * Fallback preference when storage has no valid entry — also what SSR renders.
   * Defaults to {@link DEFAULT_COLOR_SCHEME}.
   */
  readonly colorScheme?: ColorScheme;
  /**
   * `localStorage` key the preference is restored from and persisted under.
   * Defaults to {@link STORAGE_KEY}; pair with `<AppearanceScript>` using the **same key**.
   *
   * The provider reads the stored value in its initial client render (so the first paint already
   * matches the preference — no flash, no post-mount settle), auto-persists changes to
   * `localStorage` (unless {@link persistColorScheme} is also given, which then wins), and syncs
   * across tabs via the `storage` event.
   *
   * @remarks SSR has no `localStorage`, so the server renders the {@link AppearanceProviderProps.colorScheme}
   * prop. For a returning visitor whose stored preference differs, components that render
   * preference-dependent markup hydrate-reconcile once; gate them behind a mounted flag to avoid that.
   */
  readonly storageKey?: string;
};

/* -----------------------------------------------------------------------------
 * Component
 * -------------------------------------------------------------------------- */

/**
 * Provider component for color scheme state management.
 *
 * **React 19 Features Used:**
 * - `useOptimistic` - Immediate UI feedback while persisting color scheme
 * - `useSyncExternalStore` - SSR-safe subscription to OS color scheme preference
 * - `useEffectEvent` - Stable callback for cross-tab sync without effect re-runs
 *
 * @example
 * ```tsx
 * // In your root layout — pair with <AppearanceScript /> using the same storage key
 * <AppearanceProvider>{children}</AppearanceProvider>
 * ```
 *
 * @since 0.3.16-canary.0
 */
export function AppearanceProvider({
  children,
  disableTransition = false,
  nonce,
  onPersistError,
  persistColorScheme,
  storageKey = STORAGE_KEY,
  colorScheme: initialColorScheme = DEFAULT_COLOR_SCHEME,
}: AppearanceProviderProps): JSX.Element {
  // F2: Runtime guard against invalid values bypassing TypeScript (e.g. raw API strings)
  const safeInitialColorScheme = colorSchemeSchema.safeParse(initialColorScheme).success
    ? initialColorScheme
    : DEFAULT_COLOR_SCHEME;

  // Actual persisted color scheme. Read localStorage in the initializer so the first client render
  // already matches what AppearanceScript applied pre-paint (no flash, no post-mount settle). SSR has
  // no localStorage, so the server renders the prop.
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(
    () => readColorSchemeFromStorage(storageKey) ?? safeInitialColorScheme,
  );

  // Optimistic color scheme - immediately reflects user's intent while async operation runs
  // Automatically reverts to `colorScheme` if the transition fails
  const [optimisticColorScheme, setOptimisticColorScheme] = useOptimistic(colorScheme);

  // True when there's a pending color scheme change (optimistic !== actual)
  const isPending = optimisticColorScheme !== colorScheme;

  // P1: Stable ref so setColorScheme does not re-create every time the committed color scheme changes
  const committedColorSchemeRef = useRef(colorScheme);

  committedColorSchemeRef.current = colorScheme;

  // P2: Shared BroadcastChannel — reused by setColorScheme sender instead of opening a new one per call
  const channelRef = useRef<BroadcastChannel | null>(null);

  // C2: suppressTransitions cleanup stored here and called after applyColorScheme commits to the DOM
  const enableTransitionsRef = useRef<(() => void) | null>(null);

  // C3: Last-write-wins intent — prevents stale async commits from overriding newer setColorScheme calls
  const intentRef = useRef<ColorScheme | null>(null);

  // Effective persistence: an explicit persistColorScheme wins; otherwise auto-persist to localStorage.
  const persist = useMemo<(value: ColorScheme) => Promise<void>>(() => {
    if (persistColorScheme) {
      return persistColorScheme;
    }

    return async (value: ColorScheme): Promise<void> => {
      try {
        globalThis.window.localStorage.setItem(storageKey, value);
      } catch {
        /* storage blocked (private mode / quota) — optimistic UI already reflects the change */
      }
    };
  }, [persistColorScheme, storageKey]);

  // Subscribe to OS preference changes (SSR-safe via useSyncExternalStore)
  const systemColorScheme = useSyncExternalStore(subscribeToSystemColorScheme, getSystemColorScheme, getServerSnapshot);

  // Compute the actual color scheme to apply: resolve 'automatic' to light/dark
  const resolvedColorScheme = useMemo<ResolvedColorScheme>(
    () => (optimisticColorScheme === "automatic" ? systemColorScheme : optimisticColorScheme),
    [optimisticColorScheme, systemColorScheme],
  );

  // C2: Apply color scheme to DOM then call transition cleanup — ensures enable() fires after
  // applyColorScheme has committed, not prematurely in the async persist finally block
  useEffect(() => {
    applyColorScheme(resolvedColorScheme);

    const enable = enableTransitionsRef.current;

    if (enable) {
      enableTransitionsRef.current = null;
      enable();
    }
  }, [resolvedColorScheme]);

  // Mirror the *preference* (not the resolved value) to `data-appearance` so preference-aware UI
  // (e.g. a 3-state toggle) renders from CSS — matching what AppearanceScript set pre-paint. Tracks the
  // optimistic value so the attribute flips immediately on change and stays in sync across tabs.
  useEffect(() => {
    globalThis.window.document.documentElement.dataset.appearance = optimisticColorScheme;
  }, [optimisticColorScheme]);

  // S1: Validate cross-tab message before applying to prevent injection from extensions/scripts
  const handleCrossTabMessage = useEffectEvent((event: MessageEvent) => {
    const result = colorSchemeSchema.safeParse(event.data);

    if (!result.success || result.data === colorScheme) {
      return;
    }

    startTransition(() => {
      setColorSchemeState(result.data);
    });
  });

  // Cross-tab sync fallback: the `storage` event fires in OTHER tabs when this key changes.
  const handleStorageEvent = useEffectEvent((event: StorageEvent) => {
    if (event.key !== storageKey) {
      return;
    }

    const result = colorSchemeSchema.safeParse(event.newValue);

    if (!result.success || result.data === colorScheme) {
      return;
    }

    startTransition(() => {
      setColorSchemeState(result.data);
    });
  });

  // P2: Keep channel in ref so setColorScheme can broadcast without opening a new channel each time
  useEffect(() => {
    const channel = createColorSchemeChannel();

    if (!channel) {
      return;
    }

    channelRef.current = channel;
    channel.addEventListener("message", handleCrossTabMessage);

    return (): void => {
      channelRef.current = null;
      channel.removeEventListener("message", handleCrossTabMessage);
      channel.close();
    };
  }, []);

  useEffect(() => {
    globalThis.window.addEventListener("storage", handleStorageEvent);

    return (): void => {
      globalThis.window.removeEventListener("storage", handleStorageEvent);
    };
  }, []);

  const setColorScheme = useCallback(
    async (value: ColorScheme): Promise<void> => {
      await Promise.resolve();

      // P1: Read from ref so this callback stays stable across color scheme commits
      if (value === committedColorSchemeRef.current) {
        return;
      }

      // C2: Store cleanup here; it will be called after applyColorScheme runs in the resolvedColorScheme effect
      if (disableTransition) {
        enableTransitionsRef.current = suppressTransitions(nonce);
      }

      startTransition(async () => {
        // C3: Track intent; only the latest setColorScheme call commits its value
        intentRef.current = value;

        // Show new color scheme immediately (optimistic update)
        setOptimisticColorScheme(value);

        try {
          // Persist to storage
          await persist(value);

          // Only commit if no newer setColorScheme call has since taken over
          if (intentRef.current === value) {
            setColorSchemeState(value);

            // P2: Notify other tabs via shared channel
            channelRef.current?.postMessage(value);
          }
        } catch (error) {
          // On failure, useOptimistic automatically reverts to `colorScheme`
          if (onPersistError) {
            try {
              onPersistError(error, value);
            } catch (callbackError) {
              console.error("Failed to handle color scheme persist error:", callbackError);
            }
          } else {
            console.error("Failed to set color scheme:", error);
          }
        } finally {
          // C2 safety net: fires when resolvedColorScheme did not change (e.g. automatic→dark while
          // OS is already dark) so the applyColorScheme effect never runs. No-op if the effect
          // already called enable().
          const enable = enableTransitionsRef.current;

          if (enable) {
            enableTransitionsRef.current = null;
            enable();
          }
        }
      });
    },
    [disableTransition, nonce, setOptimisticColorScheme, persist, onPersistError],
  );

  // Expose optimistic color scheme so consumers see immediate updates
  const value = useMemo<ColorSchemeContextType>(
    () => ({
      isPending,
      resolvedColorScheme,
      setColorScheme,
      colorScheme: optimisticColorScheme,
    }),
    [optimisticColorScheme, resolvedColorScheme, setColorScheme, isPending],
  );

  return <ColorSchemeContext value={value}>{children}</ColorSchemeContext>;
}
