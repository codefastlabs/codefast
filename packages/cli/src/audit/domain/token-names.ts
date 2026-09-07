/** The display-name convention `token()` and `tag()` literals follow: `<namespace>:<name>`. */
import type { TokenNameViolation } from "#/audit/domain/types";

/** Both halves present and free of whitespace; a scoped package name (`@scope/pkg:Name`) passes. */
const NAMESPACED_DISPLAY_NAME = /^[^\s:]+(?::[^\s:]+)+$/;

/**
 * A bare `token(…)` or `tag(…)` call whose first argument is a string literal.
 *
 * @remarks Generic arguments are skipped up to four levels of nesting, which is deeper than any
 * declaration in the repo. Template literals are not matched: an interpolated name has no fixed
 * text to check. The closing parenthesis is kept when the name is the only argument, so the
 * reported text reads as the call was written.
 */
const DISPLAY_NAME_CALL =
  /(?<![\w$.])(token|tag)\s*(?:<(?:[^<>]|<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>)*>)?\s*\(\s*(["'])((?:(?!\2)[^\\\n]|\\.)*)\2(\s*\))?/g;

/**
 * Scans one source or markdown text for `token()` / `tag()` display names without a namespace.
 *
 * @remarks Runs on markdown as well as TypeScript because a doc sample is what a reader copies:
 * a convention the docs break is not one the docs teach.
 */
export function auditDisplayNames(sourceText: string): Array<TokenNameViolation> {
  const violations: Array<TokenNameViolation> = [];
  for (const match of sourceText.matchAll(DISPLAY_NAME_CALL)) {
    const callee = match[1]!;
    const name = match[3]!;
    if (NAMESPACED_DISPLAY_NAME.test(name)) {
      continue;
    }
    violations.push({
      line: lineOfOffset(sourceText, match.index),
      raw: match[0],
      reason: `${callee} display name '${name}' has no namespace — write '<namespace>:${name}'`,
    });
  }
  return violations;
}

function lineOfOffset(sourceText: string, offset: number): number {
  let line = 1;
  for (let index = 0; index < offset; index++) {
    if (sourceText.charCodeAt(index) === 10) {
      line++;
    }
  }
  return line;
}
