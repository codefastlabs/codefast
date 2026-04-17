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

import { DEFAULT_RESOLVED_THEME, MEDIA, THEME_CHANNEL } from "#/constants";
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

/* -----------------------------------------------------------------------------
 * Props
 * -------------------------------------------------------------------------- */

interface ThemeProviderProps {
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
   * Initial theme from server (typically from cookie via loader).
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
 */
export function ThemeProvider({
  children,
  disableTransitionOnChange = false,
  nonce,
  persistTheme,
  ssrSystemTheme,
  syncThemeFromServer,
  theme: initialTheme,
}: ThemeProviderProps): JSX.Element {
  // Actual persisted theme (source of truth after server confirms)
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  // Optimistic theme - immediately reflects user's intent while async operation runs
  // Automatically reverts to `theme` if the transition fails
  const [optimisticTheme, setOptimisticTheme] = useOptimistic(theme);

  // True when there's a pending theme change (optimistic !== actual)
  const isPending = optimisticTheme !== theme;

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

  // Apply theme class and color-scheme to <html> when resolved theme changes
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  // Handle cross-tab theme sync via BroadcastChannel
  const handleCrossTabMessage = useEffectEvent((event: MessageEvent) => {
    const newTheme = event.data as Theme;

    if (newTheme === theme) {
      return;
    }

    startTransition(() => {
      setThemeState(newTheme);
    });
  });

  useEffect(() => {
    const channel = new BroadcastChannel(THEME_CHANNEL);

    channel.addEventListener("message", handleCrossTabMessage);

    return (): void => {
      channel.removeEventListener("message", handleCrossTabMessage);
      channel.close();
    };
  }, []);

  const setTheme = useCallback(
    async (value: Theme): Promise<void> => {
      await Promise.resolve();

      if (value === theme) {
        return;
      }

      // Optionally disable animations during theme switch
      const enable = disableTransitionOnChange ? disableAnimation(nonce) : null;

      // Wrap in startTransition for proper concurrent mode handling
      startTransition(async () => {
        // Show new theme immediately (optimistic update)
        setOptimisticTheme(value);

        try {
          // Persist to server/storage
          if (persistTheme) {
            await persistTheme(value);
          }

          // Server confirmed - commit to actual state
          setThemeState(value);

          // Notify other tabs
          const channel = new BroadcastChannel(THEME_CHANNEL);

          channel.postMessage(value);
          channel.close();
        } catch (error) {
          // On failure, useOptimistic automatically reverts to `theme`
          console.error("Failed to set theme:", error);
        } finally {
          // Re-enable animations
          enable?.();
        }
      });
    },
    [theme, disableTransitionOnChange, nonce, setOptimisticTheme, persistTheme],
  );

  // Expose optimistic theme so consumers see immediate updates
  const value = useMemo<ThemeContextType>(
    () => ({ isPending, resolvedTheme, setTheme, theme: optimisticTheme }),
    [optimisticTheme, resolvedTheme, setTheme, isPending],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}
