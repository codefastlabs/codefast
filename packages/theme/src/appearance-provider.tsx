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

import type { Appearance, AppearanceContextValue, ColorScheme } from "#/appearance";
import { appearanceSchema } from "#/appearance";
import { AppearanceContext } from "#/appearance-context";
import { getSystemColorScheme } from "#/color-scheme";
import { DEFAULT_APPEARANCE, DEFAULT_COLOR_SCHEME, MEDIA, STORAGE_KEY, SYNC_CHANNEL } from "#/constants";
import { applyColorScheme, suppressTransitions } from "#/dom";

/* -----------------------------------------------------------------------------
 * System Color Scheme Subscription
 *
 * These functions power `useSyncExternalStore` for reactive OS preference detection.
 * This pattern ensures SSR safety and efficient re-renders on OS preference changes.
 * -------------------------------------------------------------------------- */

/**
 * Subscribe to OS color scheme preference changes.
 *
 * @param callback - Function to call when the OS color scheme changes
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
function getServerSnapshot(): ColorScheme {
  return DEFAULT_COLOR_SCHEME;
}

/**
 * Safely create an appearance BroadcastChannel when supported by the environment.
 */
function createAppearanceChannel(): BroadcastChannel | null {
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
 * (SSR, private mode) or when the stored value is not a recognised appearance.
 */
function readAppearanceFromStorage(storageKey: string): Appearance | null {
  if (typeof globalThis.window === "undefined") {
    return null;
  }

  try {
    const result = appearanceSchema.safeParse(globalThis.window.localStorage.getItem(storageKey));

    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/* -----------------------------------------------------------------------------
 * Props
 * -------------------------------------------------------------------------- */

/**
 * @since 0.5.0-canary.2
 */
export type AppearanceProviderProps = {
  readonly children: ReactNode;
  /**
   * When true, temporarily suppresses CSS transitions during appearance changes.
   * Prevents jarring color animations when switching appearances.
   * Default: false
   */
  readonly disableTransition?: boolean;
  /**
   * CSP nonce for inline styles when `disableTransition` is enabled.
   */
  readonly nonce?: string;
  /**
   * Custom async persistence for appearance changes; replaces the `localStorage` auto-persist.
   */
  readonly persistAppearance?: (value: Appearance) => Promise<void>;
  /**
   * Callback invoked when `persistAppearance` rejects.
   */
  readonly onPersistError?: (error: unknown, attemptedAppearance: Appearance) => void;
  /**
   * Fallback preference when storage has no valid entry — also what SSR renders.
   * Defaults to {@link DEFAULT_APPEARANCE}.
   */
  readonly appearance?: Appearance;
  /**
   * `localStorage` key the preference is restored from and persisted under.
   * Defaults to {@link STORAGE_KEY}; pair with `<AppearanceScript>` using the **same key**.
   *
   * The provider reads the stored value in its initial client render (so the first paint already
   * matches the preference — no flash, no post-mount settle), auto-persists changes to
   * `localStorage` (unless {@link persistAppearance} is also given, which then wins), and syncs
   * across tabs via the `storage` event.
   *
   * @remarks SSR has no `localStorage`, so the server renders the {@link AppearanceProviderProps.appearance}
   * prop. For a returning visitor whose stored preference differs, components that render
   * preference-dependent markup hydrate-reconcile once; gate them behind a mounted flag to avoid that.
   */
  readonly storageKey?: string;
};

/* -----------------------------------------------------------------------------
 * Component
 * -------------------------------------------------------------------------- */

/**
 * Provider component for appearance state management.
 *
 * **React 19 Features Used:**
 * - `useOptimistic` - Immediate UI feedback while persisting the preference
 * - `useSyncExternalStore` - SSR-safe subscription to the OS color scheme preference
 * - `useEffectEvent` - Stable callback for cross-tab sync without effect re-runs
 *
 * @example
 * ```tsx
 * // In your root layout — pair with <AppearanceScript /> using the same storage key
 * <AppearanceProvider>{children}</AppearanceProvider>
 * ```
 *
 * @since 0.5.0-canary.2
 */
export function AppearanceProvider({
  children,
  disableTransition = false,
  nonce,
  onPersistError,
  persistAppearance,
  storageKey = STORAGE_KEY,
  appearance: initialAppearance = DEFAULT_APPEARANCE,
}: AppearanceProviderProps): JSX.Element {
  // Runtime guard against invalid values bypassing TypeScript (e.g. raw API strings)
  const safeInitialAppearance = appearanceSchema.safeParse(initialAppearance).success
    ? initialAppearance
    : DEFAULT_APPEARANCE;

  // Actual persisted appearance. Read localStorage in the initializer so the first client render
  // already matches what AppearanceScript applied pre-paint (no flash, no post-mount settle). SSR has
  // no localStorage, so the server renders the prop.
  const [appearance, setAppearanceState] = useState<Appearance>(
    () => readAppearanceFromStorage(storageKey) ?? safeInitialAppearance,
  );

  // Optimistic appearance - immediately reflects user's intent while async operation runs
  // Automatically reverts to `appearance` if the transition fails
  const [optimisticAppearance, setOptimisticAppearance] = useOptimistic(appearance);

  // True when there's a pending appearance change (optimistic !== actual)
  const isPending = optimisticAppearance !== appearance;

  // Stable ref so setAppearance does not re-create every time the committed appearance changes
  const committedAppearanceRef = useRef(appearance);

  committedAppearanceRef.current = appearance;

  // Shared BroadcastChannel — reused by the setAppearance sender instead of opening a new one per call
  const channelRef = useRef<BroadcastChannel | null>(null);

  // suppressTransitions cleanup stored here and called after applyColorScheme commits to the DOM
  const enableTransitionsRef = useRef<(() => void) | null>(null);

  // Last-write-wins intent — prevents stale async commits from overriding newer setAppearance calls
  const intentRef = useRef<Appearance | null>(null);

  // Effective persistence: an explicit persistAppearance wins; otherwise auto-persist to localStorage.
  const persist = useMemo<(value: Appearance) => Promise<void>>(() => {
    if (persistAppearance) {
      return persistAppearance;
    }

    return async (value: Appearance): Promise<void> => {
      try {
        globalThis.window.localStorage.setItem(storageKey, value);
      } catch {
        /* storage blocked (private mode / quota) — optimistic UI already reflects the change */
      }
    };
  }, [persistAppearance, storageKey]);

  // Subscribe to OS preference changes (SSR-safe via useSyncExternalStore)
  const systemColorScheme = useSyncExternalStore(subscribeToSystemColorScheme, getSystemColorScheme, getServerSnapshot);

  // Compute the color scheme to apply: resolve 'automatic' to light/dark
  const colorScheme = useMemo<ColorScheme>(
    () => (optimisticAppearance === "automatic" ? systemColorScheme : optimisticAppearance),
    [optimisticAppearance, systemColorScheme],
  );

  // Apply the color scheme to the DOM then call the transition cleanup — ensures enable() fires
  // after applyColorScheme has committed, not prematurely in the async persist finally block
  useEffect(() => {
    applyColorScheme(colorScheme);

    const enable = enableTransitionsRef.current;

    if (enable) {
      enableTransitionsRef.current = null;
      enable();
    }
  }, [colorScheme]);

  // Mirror the *preference* (not the resolved value) to `data-appearance` so preference-aware UI
  // (e.g. a 3-state toggle) renders from CSS — matching what AppearanceScript set pre-paint. Tracks the
  // optimistic value so the attribute flips immediately on change and stays in sync across tabs.
  useEffect(() => {
    globalThis.window.document.documentElement.dataset.appearance = optimisticAppearance;
  }, [optimisticAppearance]);

  // Validate cross-tab messages before applying to prevent injection from extensions/scripts
  const handleCrossTabMessage = useEffectEvent((event: MessageEvent) => {
    const result = appearanceSchema.safeParse(event.data);

    if (!result.success || result.data === appearance) {
      return;
    }

    startTransition(() => {
      setAppearanceState(result.data);
    });
  });

  // Cross-tab sync fallback: the `storage` event fires in OTHER tabs when this key changes.
  const handleStorageEvent = useEffectEvent((event: StorageEvent) => {
    if (event.key !== storageKey) {
      return;
    }

    const result = appearanceSchema.safeParse(event.newValue);

    if (!result.success || result.data === appearance) {
      return;
    }

    startTransition(() => {
      setAppearanceState(result.data);
    });
  });

  // Keep the channel in a ref so setAppearance can broadcast without opening a new channel each time
  useEffect(() => {
    const channel = createAppearanceChannel();

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

  const setAppearance = useCallback(
    async (value: Appearance): Promise<void> => {
      await Promise.resolve();

      // Read from ref so this callback stays stable across appearance commits
      if (value === committedAppearanceRef.current) {
        return;
      }

      // Store the cleanup; it will be called after applyColorScheme runs in the colorScheme effect
      if (disableTransition) {
        enableTransitionsRef.current = suppressTransitions(nonce);
      }

      startTransition(async () => {
        // Track intent; only the latest setAppearance call commits its value
        intentRef.current = value;

        // Show the new appearance immediately (optimistic update)
        setOptimisticAppearance(value);

        try {
          // Persist to storage
          await persist(value);

          // Only commit if no newer setAppearance call has since taken over
          if (intentRef.current === value) {
            setAppearanceState(value);

            // Notify other tabs via the shared channel
            channelRef.current?.postMessage(value);
          }
        } catch (error) {
          // On failure, useOptimistic automatically reverts to `appearance`
          if (onPersistError) {
            try {
              onPersistError(error, value);
            } catch (callbackError) {
              console.error("Failed to handle appearance persist error:", callbackError);
            }
          } else {
            console.error("Failed to set appearance:", error);
          }
        } finally {
          // Safety net: fires when the color scheme did not change (e.g. automatic→dark while
          // the OS is already dark) so the applyColorScheme effect never runs. No-op if the effect
          // already called enable().
          const enable = enableTransitionsRef.current;

          if (enable) {
            enableTransitionsRef.current = null;
            enable();
          }
        }
      });
    },
    [disableTransition, nonce, setOptimisticAppearance, persist, onPersistError],
  );

  // Expose the optimistic appearance so consumers see immediate updates
  const value = useMemo<AppearanceContextValue>(
    () => ({
      isPending,
      colorScheme,
      setAppearance,
      appearance: optimisticAppearance,
    }),
    [optimisticAppearance, colorScheme, setAppearance, isPending],
  );

  return <AppearanceContext value={value}>{children}</AppearanceContext>;
}
