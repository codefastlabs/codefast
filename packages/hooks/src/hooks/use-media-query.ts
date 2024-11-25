import { useEffect, useState } from 'react';

/**
 * Custom hook to listen to CSS media query.
 *
 * @param query - Media query string.
 * @returns whether the media query matches or not.
 */
export function useMediaQuery(query: string): boolean {
  // State to store whether the query matches
  const [matches, setMatches] = useState<boolean>(() => {
    // Ensure initial state matches current media query status
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }

    return false;
  });

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);

    // Update state when the media query status changes
    const listener = (event: MediaQueryListEvent): void => {
      setMatches(event.matches);
    };

    mediaQueryList.addEventListener('change', listener);

    // Clean up listener on a component unmount
    return () => {
      mediaQueryList.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
}
