import * as React from 'react';

/**
 * Evaluates a media query and returns whether it matches the current viewport.
 *
 * @param query - The media query string to evaluate.
 * @returns true if the media query matches the viewport, false otherwise.
 */
export function useMediaQuery(query: string): boolean {
  const [value, setValue] = React.useState(false);

  React.useEffect(() => {
    function onChange(event: MediaQueryListEvent): void {
      setValue(event.matches);
    }

    const result = matchMedia(query);

    result.addEventListener('change', onChange);
    setValue(result.matches);

    return () => {
      result.removeEventListener('change', onChange);
    };
  }, [query]);

  return value;
}
