/** The display-name convention: a name is spelled like the TS symbol it stands for, under its owner's namespace. */
import type { DisplayNameViolation } from "#/audit/domain/types";

/** The owner: a kebab-case package, app or feature slug, or a scoped package name. */
const NAMESPACE = /^(?:@[a-z0-9-]+\/)?[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** A token or module stands for a type or a unit of composition. */
const PASCAL_CASE = /^[A-Z][A-Za-z0-9]*$/;
/** A tag key stands for an attribute a request selects on, so it reads like a property. */
const CAMEL_CASE = /^[a-z][A-Za-z0-9]*$/;

/**
 * A bare `token(…)` / `tag(…)` call, or a module factory call, whose first argument is a string literal.
 *
 * @remarks Generic arguments are skipped up to four levels of nesting, which is deeper than any
 * declaration in the repo. Template literals are not matched: an interpolated name has no fixed
 * text to check. The closing parenthesis is kept when the name is the only argument, so the
 * reported text reads as the call was written.
 */
const DISPLAY_NAME_CALL =
  /(?<![\w$.])(?:(token|tag)\s*(?:<(?:[^<>]|<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>)*>)?|((?:Sync|Async)?Module)\s*\.\s*create(?:Async)?)\s*\(\s*(["'])((?:(?!\3)[^\\\n]|\\.)*)\3(\s*\))?/g;

type DisplayNameKind = "token" | "tag" | "module";

const KIND_LABEL: Record<DisplayNameKind, string> = {
  token: "token display name",
  tag: "tag key",
  module: "module name",
};

/**
 * Scans one source or markdown text for `token()`, `tag()` and module display names that break the convention.
 *
 * @remarks Runs on markdown as well as TypeScript because a doc sample is what a reader copies:
 * a convention the docs break is not one the docs teach.
 */
export function auditDisplayNames(sourceText: string): Array<DisplayNameViolation> {
  const violations: Array<DisplayNameViolation> = [];
  for (const match of sourceText.matchAll(DISPLAY_NAME_CALL)) {
    const kind: DisplayNameKind = match[1] === undefined ? "module" : (match[1] as "token" | "tag");
    const reason = reasonFor(kind, match[4]!);
    if (reason === null) {
      continue;
    }
    violations.push({ line: lineOfOffset(sourceText, match.index), raw: match[0], reason });
  }
  return violations;
}

/** Why a display name breaks the convention, or `null` when it holds. */
function reasonFor(kind: DisplayNameKind, name: string): string | null {
  const segments = name.split(":");
  const label = KIND_LABEL[kind];
  if (segments.length < 2) {
    return `${label} '${name}' has no namespace — write '<namespace>:${name}'`;
  }
  const local = segments.at(-1)!;
  for (const namespace of segments.slice(0, -1)) {
    if (!NAMESPACE.test(namespace)) {
      return `namespace '${namespace}' in '${name}' is not kebab-case (or a scoped package name)`;
    }
  }
  if (kind === "tag") {
    return CAMEL_CASE.test(local)
      ? null
      : `${label} '${local}' in '${name}' is not camelCase — a tag key names an attribute`;
  }
  return PASCAL_CASE.test(local)
    ? null
    : `${label} '${local}' in '${name}' is not PascalCase — a ${kind} stands for a ${kind === "token" ? "type" : "unit of composition"}`;
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
