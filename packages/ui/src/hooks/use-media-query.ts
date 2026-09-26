import { useCallback, useSyncExternalStore } from "react";

/**
 * Subscribes to a CSS media query and returns whether it matches.
 *
 * Reports `false` during SSR and hydration, so the first client render matches the server markup, then the live
 * match state, updating whenever the query flips.
 *
 * @param query - A valid media query string (e.g., "(max-width: 768px)").
 * @returns true when the media query currently matches; otherwise false.
 *
 * @example
 * ```tsx
 * const isNarrow = useMediaQuery("(max-width: 768px)");
 * ```
 *
 * @since 0.3.16-canary.0
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void): (() => void) => {
      if (!canMatchMedia()) {
        return () => {};
      }

      const mediaQueryList = window.matchMedia(query);

      mediaQueryList.addEventListener("change", onChange);

      return (): void => {
        mediaQueryList.removeEventListener("change", onChange);
      };
    },
    [query],
  );

  const getSnapshot = useCallback((): boolean => canMatchMedia() && window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function getServerSnapshot(): boolean {
  return false;
}

function canMatchMedia(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function";
}
