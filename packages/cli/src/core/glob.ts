import picomatch from "picomatch";

/**
 * A predicate over a string — returns `true` when the value matches.
 *
 * @since 0.5.0-canary.0
 */
export type StringMatcher = (value: string) => boolean;

/**
 * Compiles glob patterns into a predicate that matches a value any of them matches, and nothing when there are none.
 *
 * @since 0.5.0-canary.0
 */
export function createAnyGlobMatcher(
  patterns: ReadonlyArray<string> | undefined,
  options?: Parameters<typeof picomatch>[1],
): StringMatcher {
  if (!patterns || patterns.length === 0) {
    return () => false;
  }

  const matchers = patterns.map((pattern) => picomatch(pattern, options));
  return (value) => matchers.some((isMatch) => isMatch(value));
}
