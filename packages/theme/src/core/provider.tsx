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

import type { ResolvedTheme, Theme, ThemeContextType } from "#/types";

import { DEFAULT_RESOLVED_THEME, DEFAULT_THEME, MEDIA, THEME_CHANNEL } from "#/constants";
import { themeSchema } from "#/types";
import { ThemeContext } from "#/core/context";
import { applyTheme, disableAnimation } from "#/utils/dom";
import { getSystemTheme } from "#/utils/system";

/* -----------------------------------------------------------------------------
 * System Theme Subscription
 *
 * These functions power `useSyncExternalStore` for reactive system theme detection.
 * This pattern ensures SSR safety and efficient re-renders on OS preference changes.
 * -------------------------------------------------------------------------- */

/**
 * Subscribe to OS theme preference changes.
 *
 * @param callback - Function to call when system theme changes
 * @returns Cleanup function to remove the listener
 */
function subscribeToSystemTheme(callback: () => void): () => void {
  const mediaQuery = window.matchMedia(MEDIA);

  mediaQuery.addEventListener("change", callback);

  return () => {
    mediaQuery.removeEventListener("change", callback);
  };
}

/**
 * Get current system theme on the client.
 */
function getSystemThemeSnapshot(): ResolvedTheme {
  return getSystemTheme();
}

/**
 * Safely create a theme BroadcastChannel when supported by the environment.
 */
function createThemeChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") {
    return null;
  }

  try {
    return new BroadcastChannel(THEME_CHANNEL);
  } catch {
    return null;
  }
}

/* -----------------------------------------------------------------------------
 * Props
 * -------------------------------------------------------------------------- */

export interface ThemeProviderProps {
  children: ReactNode;
  /**
   * When true, temporarily disables CSS transitions during theme changes.
   * Prevents jarring color animations when switching themes.
   * Default: false
   */
  disableTransitionOnChange?: boolean;
  /**
   * CSP nonce for inline styles when `disableTransitionOnChange` is enabled.
   */
  nonce?: string;
  /**
   * Async function to persist theme changes to server/storage.
   *
   * For TanStack Start: use `setThemeServerFn` from `@codefast/theme/start`
   * For Next.js: implement a server action
   */
  persistTheme?: (value: Theme) => Promise<void>;
  /**
   * Callback invoked when `persistTheme` rejects.
   */
  onThemePersistError?: (error: unknown, attemptedTheme: Theme) => void;
  /**
   * Initial theme preference from the server (cookie, loader, etc.).
   *
   * After mount, `ThemeProvider` re-syncs whenever this prop changes — for example, when
   * the router re-runs the root loader after navigation. The server value is authoritative:
   * a new prop value will override any local optimistic state.
   */
  theme: Theme;
  /**
   * OS light/dark guess from the SSR request (e.g. `Sec-CH-Prefers-Color-Scheme`).
   *
   * When the stored preference is `system`, {@link useSyncExternalStore} uses this for
   * `getServerSnapshot` so the first client snapshot matches `matchMedia` and avoids a
   * dark → light flip after hydration.
   */
  ssrSystemTheme?: ResolvedTheme;
  /**
   * After mount, re-read the canonical theme from the server (e.g. httpOnly cookie).
   *
   * Fixes **stale HTML / disk cache** on “Duplicate tab” or back-forward cache where the
   * document was saved with an old `ThemeScript` / loader value while the cookie was already updated
   * in another tab. Use a stable reference (e.g. `getThemeServerFn` from `@codefast/theme/start`).
   */
  syncThemeFromServer?: () => Promise<Theme>;
}

/* -----------------------------------------------------------------------------
 * Component
 * -------------------------------------------------------------------------- */

/**
 * Provider component for theme state management.
 *
 * **React 19 Features Used:**
 * - `useOptimistic` - Immediate UI feedback while persisting theme
 * - `useSyncExternalStore` - SSR-safe subscription to OS theme preference
 * - `useEffectEvent` - Stable callback for cross-tab sync without effect re-runs
 *
 * @param props - Component props
 * @param props.children - React tree to provide context for
 * @param props.theme - Initial preference from the server (cookie, loader, etc.)
 * @param props.ssrSystemTheme - Best-effort `light` or `dark` from the SSR request
 * (e.g. `Sec-CH-Prefers-Color-Scheme`). When preference is `system`, this value is used as
 * `useSyncExternalStore`'s server snapshot so the first client snapshot matches `matchMedia`
 * and avoids a post-hydration flip. Omit if unavailable; falls back to {@link DEFAULT_RESOLVED_THEME}.
 * @param props.syncThemeFromServer - Optional one-shot RPC after mount to align with the cookie when SSR/HTML was stale.
 * @param props.persistTheme - Optional async handler to persist preference (cookie, server action, …)
 * @param props.onThemePersistError - Optional callback for persistence failures
 * @param props.disableTransitionOnChange - Temporarily disable CSS transitions on theme change
 * @param props.nonce - CSP nonce for inline transition-blocking styles when `disableTransitionOnChange` is set
 * @returns Provider element wrapping `children`
 *
 * @example
 * ```tsx
 * // In your root layout
 * <ThemeProvider
 *   theme={theme}
 *   persistTheme={(value) => setThemeServerFn({ data: value })}
 * >
 *   {children}
 * </ThemeProvider>
 * ```
 *
 * @since 0.3.16-canary.0
 */
export function ThemeProvider({
  children,
  disableTransitionOnChange = false,
  nonce,
  onThemePersistError,
  persistTheme,
  ssrSystemTheme,
  syncThemeFromServer,
  theme: initialTheme,
}: ThemeProviderProps): JSX.Element {
  // F2: Runtime guard against invalid values bypassing TypeScript (e.g. raw API strings)
  const safeInitialTheme = themeSchema.safeParse(initialTheme).success
    ? initialTheme
    : DEFAULT_THEME;

  // Actual persisted theme (source of truth after server confirms)
  const [theme, setThemeState] = useState<Theme>(safeInitialTheme);

  // Optimistic theme - immediately reflects user's intent while async operation runs
  // Automatically reverts to `theme` if the transition fails
  const [optimisticTheme, setOptimisticTheme] = useOptimistic(theme);

  // True when there's a pending theme change (optimistic !== actual)
  const isPending = optimisticTheme !== theme;

  // P1: Stable ref so setTheme does not re-create every time the committed theme changes
  const committedThemeRef = useRef(theme);

  committedThemeRef.current = theme;

  // P2: Shared BroadcastChannel — reused by setTheme sender instead of opening a new one per call
  const channelRef = useRef<BroadcastChannel | null>(null);

  // C2: disableAnimation cleanup stored here and called after applyTheme commits to the DOM
  const enableAnimationRef = useRef<(() => void) | null>(null);

  // C3: Last-write-wins intent — prevents stale async commits from overriding newer setTheme calls
  const intentRef = useRef<Theme | null>(null);

  // C1: Re-sync state when the server (loader) provides a new theme value after mount
  useEffect(() => {
    startTransition(() => {
      setThemeState((prev) => (prev === safeInitialTheme ? prev : safeInitialTheme));
    });
  }, [safeInitialTheme]);

  const syncThemeFromServerRef = useRef(syncThemeFromServer);

  syncThemeFromServerRef.current = syncThemeFromServer;

  useEffect(() => {
    const sync = syncThemeFromServerRef.current;

    if (!sync) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const serverTheme = await sync();

        if (cancelled) {
          return;
        }

        startTransition(() => {
          setThemeState((prev) => (prev === serverTheme ? prev : serverTheme));
        });
      } catch {
        /* keep SSR / loader state */
      }
    })();

    return (): void => {
      cancelled = true;
    };
  }, []);

  const getServerSnapshot = useCallback((): ResolvedTheme => {
    return ssrSystemTheme ?? DEFAULT_RESOLVED_THEME;
  }, [ssrSystemTheme]);

  // Subscribe to OS preference changes (SSR-safe via useSyncExternalStore)
  const systemTheme = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemThemeSnapshot,
    getServerSnapshot,
  );

  // Compute the actual theme to apply: resolve 'system' to light/dark
  const resolvedTheme = useMemo<ResolvedTheme>(
    () => (optimisticTheme === "system" ? systemTheme : optimisticTheme),
    [optimisticTheme, systemTheme],
  );

  // C2: Apply theme to DOM then call animation cleanup — ensures enable() fires after
  // applyTheme has committed, not prematurely in the async persist finally block
  useEffect(() => {
    applyTheme(resolvedTheme);

    const enable = enableAnimationRef.current;

    if (enable) {
      enableAnimationRef.current = null;
      enable();
    }
  }, [resolvedTheme]);

  // S1: Validate cross-tab message before applying to prevent injection from extensions/scripts
  const handleCrossTabMessage = useEffectEvent((event: MessageEvent) => {
    const result = themeSchema.safeParse(event.data);

    if (!result.success || result.data === theme) {
      return;
    }

    startTransition(() => {
      setThemeState(result.data);
    });
  });

  // P2: Keep channel in ref so setTheme can broadcast without opening a new channel each time
  useEffect(() => {
    const channel = createThemeChannel();

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

  const setTheme = useCallback(
    async (value: Theme): Promise<void> => {
      await Promise.resolve();

      // P1: Read from ref so this callback stays stable across theme commits
      if (value === committedThemeRef.current) {
        return;
      }

      // C2: Store cleanup here; it will be called after applyTheme runs in the resolvedTheme effect
      if (disableTransitionOnChange) {
        enableAnimationRef.current = disableAnimation(nonce);
      }

      startTransition(async () => {
        // C3: Track intent; only the latest setTheme call commits its value
        intentRef.current = value;

        // Show new theme immediately (optimistic update)
        setOptimisticTheme(value);

        try {
          // Persist to server/storage
          if (persistTheme) {
            await persistTheme(value);
          }

          // Only commit if no newer setTheme call has since taken over
          if (intentRef.current === value) {
            setThemeState(value);

            // P2: Notify other tabs via shared channel
            channelRef.current?.postMessage(value);
          }
        } catch (error) {
          // On failure, useOptimistic automatically reverts to `theme`
          if (onThemePersistError) {
            try {
              onThemePersistError(error, value);
            } catch (callbackError) {
              console.error("Failed to handle theme persist error:", callbackError);
            }
          } else {
            console.error("Failed to set theme:", error);
          }
        } finally {
          // C2 safety net: fires when resolvedTheme did not change (e.g. system→dark while
          // OS is already dark) so the applyTheme effect never runs. No-op if the effect
          // already called enable().
          const enable = enableAnimationRef.current;

          if (enable) {
            enableAnimationRef.current = null;
            enable();
          }
        }
      });
    },
    [disableTransitionOnChange, nonce, setOptimisticTheme, persistTheme, onThemePersistError],
  );

  // Expose optimistic theme so consumers see immediate updates
  const value = useMemo<ThemeContextType>(
    () => ({ isPending, resolvedTheme, setTheme, theme: optimisticTheme }),
    [optimisticTheme, resolvedTheme, setTheme, isPending],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}
