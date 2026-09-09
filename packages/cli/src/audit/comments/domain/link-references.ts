/**
 * Resolves `{@link}` references against the scanned tree, so a rename that orphans one is caught.
 */

/**
 * One `{@link}` occurrence found inside a comment.
 *
 * @since 0.6.0
 */
export interface LinkReference {
  readonly line: number;
  /** The target as written, e.g. `writeJsonlRun`, `Foo.bar`, `../fixtures/adapter.ts`. */
  readonly target: string;
}

const linkPattern = /\{@link\s+([^}|\s]+)/g;
const commentLinePattern = /^[ \t]*(?:\/\/|\/\*|\*)/;

/**
 * Every `{@link}` target in a file's comments, in source order.
 *
 * @since 0.6.0
 */
export function scanLinkReferences(content: string): Array<LinkReference> {
  const references: Array<LinkReference> = [];
  const lines = content.split(/\r?\n/);
  for (let index = 0; index < lines.length; index++) {
    if (!commentLinePattern.test(lines[index]!)) {
      continue;
    }
    for (const match of lines[index]!.matchAll(linkPattern)) {
      references.push({ line: index + 1, target: match[1]! });
    }
  }
  return references;
}

/**
 * The identifier a declaration-style target must resolve through — `Foo.bar` resolves via `Foo`.
 *
 * @since 0.6.0
 */
export function linkTargetHead(target: string): string {
  return target.split(/[.#]/, 1)[0]!;
}

/**
 * Whether a target names a file or URL rather than a declaration.
 *
 * @since 0.6.0
 */
export function isPathLinkTarget(target: string): boolean {
  return (
    target.startsWith("http://") || target.startsWith("https://") || target.startsWith("./") || target.startsWith("../")
  );
}

/**
 * Counts word-boundary occurrences of each head across a body of source text.
 *
 * @remarks A `{@link X}` occurrence itself mentions `X` once, so a target is orphaned when its
 * total mentions do not exceed its link occurrences — a rename removes every real mention.
 *
 * @since 0.6.0
 */
export function countHeadMentions(contents: Iterable<string>, heads: ReadonlySet<string>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const head of heads) {
    counts.set(head, 0);
  }
  const wordPattern = /[A-Za-z_$][\w$]*/g;
  for (const content of contents) {
    for (const match of content.matchAll(wordPattern)) {
      const found = counts.get(match[0]);
      if (found !== undefined) {
        counts.set(match[0], found + 1);
      }
    }
  }
  return counts;
}
