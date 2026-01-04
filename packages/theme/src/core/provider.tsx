import {
  startTransition,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useOptimistic,
  useState,
  useSyncExternalStore,
} from 'react';
import type { JSX, ReactNode } from 'react';
import type { ResolvedTheme, Theme, ThemeContextType } from '@/types';
import { DEFAULT_RESOLVED_THEME, MEDIA, THEME_CHANNEL } from '@/constants';
import { ThemeContext } from '@/core/context';
import { applyTheme, disableAnimation, getSystemTheme } from '@/utils';

/* -----------------------------------------------------------------------------
 * System Theme Subscription (for useSyncExternalStore)
 * -------------------------------------------------------------------------- */

function subscribeToSystemTheme(callback: () => void): () => void {
  const mediaQuery = window.matchMedia(MEDIA);

  mediaQuery.addEventListener('change', callback);

  return () => mediaQuery.removeEventListener('change', callback);
}

function getSystemThemeSnapshot(): ResolvedTheme {
  return getSystemTheme();
}

function getServerSnapshot(): ResolvedTheme {
  return DEFAULT_RESOLVED_THEME;
}

/* -----------------------------------------------------------------------------
 * Props
 * -------------------------------------------------------------------------- */

interface ThemeProviderProps {
  children: ReactNode;
  theme: Theme;
  /**
   * Callback to persist theme changes.
   * For TanStack Start, use setThemeServerFn from `@codefast/theme/tanstack-start`.
   * For Next.js, implement your own server action.
   */
  persistTheme?: (value: Theme) => Promise<void>;
  disableTransitionOnChange?: boolean;
  nonce?: string;
}

/* -----------------------------------------------------------------------------
 * Component: ThemeProvider
 * -------------------------------------------------------------------------- */

/**
 * Provider component for managing theme state with system preference support.
 * Uses React 19's useOptimistic for immediate UI feedback during theme changes.
 */
export function ThemeProvider({
  children,
  theme: initialTheme,
  persistTheme,
  disableTransitionOnChange = false,
  nonce,
}: ThemeProviderProps): JSX.Element {
  // Actual persisted theme state (synced with server/cookie)
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  // Optimistic theme - shows pending value immediately while async operation is in flight
  // Automatically reverts to `theme` when the transition completes (success or failure)
  const [optimisticTheme, setOptimisticTheme] = useOptimistic(theme);

  // Track if we're in the middle of a theme change
  const isPending = optimisticTheme !== theme;

  // Subscribe to system theme changes using useSyncExternalStore (SSR-safe)
  const systemTheme = useSyncExternalStore(subscribeToSystemTheme, getSystemThemeSnapshot, getServerSnapshot);

  // Derive resolvedTheme from optimisticTheme - no separate state needed
  const resolvedTheme = useMemo<ResolvedTheme>(
    () => (optimisticTheme === 'system' ? systemTheme : optimisticTheme),
    [optimisticTheme, systemTheme],
  );

  // Apply theme to DOM when resolved theme changes
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  // Handler for cross-tab theme sync - using useEffectEvent to avoid re-subscribing
  const onCrossTabSync = useEffectEvent((newTheme: Theme) => {
    if (newTheme === theme) return;

    startTransition(() => {
      setThemeState(newTheme);
    });
  });

  // Effect to handle cross-tab theme sync via BroadcastChannel
  useEffect(() => {
    const channel = new BroadcastChannel(THEME_CHANNEL);

    channel.onmessage = (event) => {
      onCrossTabSync(event.data as Theme);
    };

    return () => channel.close();
  }, []);

  const setTheme = useCallback(
    async (value: Theme): Promise<void> => {
      if (value === theme) return;

      const enable = disableTransitionOnChange ? disableAnimation(nonce) : null;

      // Use startTransition to wrap the optimistic update and async operation
      // This ensures React knows they're part of the same transition
      startTransition(async () => {
        // Immediately show the new theme (optimistic update)
        setOptimisticTheme(value);

        try {
          // Persist theme if callback provided
          if (persistTheme) {
            await persistTheme(value);
          }

          // Server confirmed - update the actual state
          setThemeState(value);

          // Notify other tabs about theme change
          const channel = new BroadcastChannel(THEME_CHANNEL);

          channel.postMessage(value);
          channel.close();
        } catch (error) {
          // On error, React automatically reverts optimisticTheme to match theme
          // because the transition ends and optimisticTheme falls back to theme
          console.error('Failed to set theme:', error);
        } finally {
          enable?.();
        }
      });
    },
    [theme, disableTransitionOnChange, nonce, setOptimisticTheme, persistTheme],
  );

  // Use optimisticTheme for context so consumers see immediate updates
  const value = useMemo<ThemeContextType>(
    () => ({ theme: optimisticTheme, resolvedTheme, setTheme, isPending }),
    [optimisticTheme, resolvedTheme, setTheme, isPending],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}
