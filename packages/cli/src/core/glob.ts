import picomatch from "picomatch";

/**
 * A predicate over a string — returns `true` when the value matches.
 *
 * @since 0.5.0-canary.0
 */
export type StringMatcher = (value: string) => boolean;

/**
 * Compile a list of glob patterns into a predicate that returns `true` when its
 * argument matches **any** of them (picomatch semantics). Returns a never-match
 * predicate when no patterns are supplied.
 *
 * Shared by every "match a name/path against a configured pattern list" use
 * (workspace excludes, `tag.skipPackages`, …) so the compile-then-`some` logic
 * lives in one place.
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
