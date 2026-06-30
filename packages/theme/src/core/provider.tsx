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

import { DEFAULT_RESOLVED_COLOR_SCHEME, DEFAULT_COLOR_SCHEME, MEDIA, SYNC_CHANNEL } from "#/constants";
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
   * Async function to persist color scheme changes to server/storage.
   *
   * For TanStack Start: use `persistColorSchemeCookie` from `@codefast/theme/start`
   * For Next.js: implement a server action
   */
  readonly persistColorScheme?: (value: ColorScheme) => Promise<void>;
  /**
   * Callback invoked when `persistColorScheme` rejects.
   */
  readonly onPersistError?: (error: unknown, attemptedColorScheme: ColorScheme) => void;
  /**
   * Initial color scheme preference from the server (cookie, loader, etc.).
   *
   * After mount, `AppearanceProvider` re-syncs whenever this prop changes — for example, when
   * the router re-runs the root loader after navigation. The server value is authoritative:
   * a new prop value will override any local optimistic state.
   */
  readonly colorScheme: ColorScheme;
  /**
   * OS light/dark guess from the SSR request (e.g. `Sec-CH-Prefers-Color-Scheme`).
   *
   * When the stored preference is `automatic`, {@link useSyncExternalStore} uses this for
   * `getServerSnapshot` so the first client snapshot matches `matchMedia` and avoids a
   * dark → light flip after hydration.
   */
  readonly ssrColorScheme?: ResolvedColorScheme;
  /**
   * After mount, re-read the canonical color scheme from the server (e.g. httpOnly cookie).
   *
   * Fixes **stale HTML / disk cache** on "Duplicate tab" or back-forward cache where the
   * document was saved with an old `AppearanceScript` / loader value while the cookie was already updated
   * in another tab. Use a stable reference (e.g. `getColorSchemeServerFn` from `@codefast/theme/start`).
   */
  readonly syncFromServer?: () => Promise<ColorScheme>;
  /**
   * Persist + restore the preference in `localStorage` under this key — the client-only path
   * (no server framework, no cookie, no loader).
   *
   * When set, the provider reads the stored value in its initial client render (so the first paint
   * already matches the preference — no flash, no post-mount settle), auto-persists changes to
   * `localStorage` (unless {@link persistColorScheme} is also given, which then wins), and syncs across
   * tabs via the `storage` event. Pair with `<AppearanceScript storageKey={…} />` using the **same key**.
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
 * @param props - Component props
 * @param props.children - React tree to provide context for
 * @param props.colorScheme - Initial preference from the server (cookie, loader, etc.)
 * @param props.ssrColorScheme - Best-effort `light` or `dark` from the SSR request
 * (e.g. `Sec-CH-Prefers-Color-Scheme`). When preference is `automatic`, this value is used as
 * `useSyncExternalStore`'s server snapshot so the first client snapshot matches `matchMedia`
 * and avoids a post-hydration flip. Omit if unavailable; falls back to {@link DEFAULT_RESOLVED_COLOR_SCHEME}.
 * @param props.syncFromServer - Optional one-shot RPC after mount to align with the cookie when SSR/HTML was stale.
 * @param props.storageKey - Optional localStorage key for the client-only path: restore in the initial render, auto-persist, cross-tab sync.
 * @param props.persistColorScheme - Optional async handler to persist preference (cookie, server action, …)
 * @param props.onPersistError - Optional callback for persistence failures
 * @param props.disableTransition - Temporarily suppress CSS transitions on color scheme change
 * @param props.nonce - CSP nonce for inline transition-blocking styles when `disableTransition` is set
 * @returns Provider element wrapping `children`
 *
 * @example
 * ```tsx
 * // In your root layout
 * <AppearanceProvider
 *   colorScheme={colorScheme}
 *   persistColorScheme={(value) => setColorSchemeServerFn({ data: value })}
 * >
 *   {children}
 * </AppearanceProvider>
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
  ssrColorScheme,
  storageKey,
  syncFromServer,
  colorScheme: initialColorScheme,
}: AppearanceProviderProps): JSX.Element {
  // F2: Runtime guard against invalid values bypassing TypeScript (e.g. raw API strings)
  const safeInitialColorScheme = colorSchemeSchema.safeParse(initialColorScheme).success
    ? initialColorScheme
    : DEFAULT_COLOR_SCHEME;

  // Actual persisted color scheme. Storage path: read localStorage in the initializer so the first client
  // render already matches what AppearanceScript applied pre-paint (no flash, no post-mount settle). SSR has
  // no localStorage, so the server renders the prop.
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => {
    if (storageKey !== undefined) {
      const stored = readColorSchemeFromStorage(storageKey);

      if (stored !== null) {
        return stored;
      }
    }

    return safeInitialColorScheme;
  });

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

  // Effective persistence: an explicit persistColorScheme wins; otherwise storageKey auto-persists to localStorage.
  const persist = useMemo<((value: ColorScheme) => Promise<void>) | undefined>(() => {
    if (persistColorScheme) {
      return persistColorScheme;
    }

    if (storageKey === undefined) {
      return undefined;
    }

    return async (value: ColorScheme): Promise<void> => {
      try {
        globalThis.window.localStorage.setItem(storageKey, value);
      } catch {
        /* storage blocked (private mode / quota) — optimistic UI already reflects the change */
      }
    };
  }, [persistColorScheme, storageKey]);

  // C1: Re-sync state when the server (loader) provides a new color scheme value after mount.
  // Storage path owns the preference client-side; the prop is only a static default — don't clobber it.
  useEffect(() => {
    if (storageKey !== undefined) {
      return;
    }

    startTransition(() => {
      setColorSchemeState((prev) => (prev === safeInitialColorScheme ? prev : safeInitialColorScheme));
    });
  }, [safeInitialColorScheme, storageKey]);

  const syncFromServerRef = useRef(syncFromServer);

  syncFromServerRef.current = syncFromServer;

  useEffect(() => {
    const sync = syncFromServerRef.current;

    if (!sync) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const serverColorScheme = await sync();

        if (cancelled) {
          return;
        }

        startTransition(() => {
          setColorSchemeState((prev) => (prev === serverColorScheme ? prev : serverColorScheme));
        });
      } catch {
        /* keep SSR / loader state */
      }
    })();

    return (): void => {
      cancelled = true;
    };
  }, []);

  const getServerSnapshot = useCallback((): ResolvedColorScheme => {
    return ssrColorScheme ?? DEFAULT_RESOLVED_COLOR_SCHEME;
  }, [ssrColorScheme]);

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

  // Storage path cross-tab sync: the `storage` event fires in OTHER tabs when this key changes.
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
    if (storageKey === undefined) {
      return;
    }

    globalThis.window.addEventListener("storage", handleStorageEvent);

    return (): void => {
      globalThis.window.removeEventListener("storage", handleStorageEvent);
    };
  }, [storageKey]);

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
          // Persist to server/storage
          if (persist) {
            await persist(value);
          }

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
