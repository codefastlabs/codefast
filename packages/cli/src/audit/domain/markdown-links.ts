/**
 * Extracts the two things a markdown cross-reference can get wrong: where it points and what it lands on.
 */

/**
 * One `[text](target)` whose target is a path in this repository.
 *
 * @since 0.5.0
 */
type MarkdownLinkReference = {
  readonly line: number;
  /** The path as written, with any fragment stripped. Empty when the link is fragment-only. */
  readonly targetPath: string;
  /** The `#fragment`, without the hash, or `null`. */
  readonly anchor: string | null;
};

/**
 * The anchors a document offers, and the references it makes.
 *
 * @since 0.5.0
 */
export type MarkdownLinkScan = {
  readonly references: ReadonlyArray<MarkdownLinkReference>;
  readonly anchors: ReadonlySet<string>;
};

// Anything with a scheme, a protocol-relative host, or a bare mail address is somebody else's to check.
const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

/**
 * The anchor ids a rendered document exposes: explicit `<a id>` targets plus every heading's slug.
 *
 * @remarks Slugging matches GitHub's — lowercase, drop everything that is not a letter, number, space
 * or hyphen, then hyphenate spaces. Duplicate headings get a `-1` suffix there; this returns the base
 * only, so a link to the second copy reads as dangling rather than being silently accepted.
 *
 * @since 0.5.0
 */
export function collectMarkdownAnchors(content: string): Set<string> {
  const anchors = new Set<string>();

  for (const match of content.matchAll(/<a\s+id="([^"]+)"\s*><\/a>/g)) {
    anchors.add(match[1]!);
  }
  for (const match of content.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)) {
    anchors.add(
      match[1]!
        .toLowerCase()
        .replaceAll(/[^\p{L}\p{N} -]/gu, "")
        .trim()
        .replaceAll(/\s+/g, "-"),
    );
  }

  return anchors;
}

/**
 * Every repo-local link a document makes, with the anchors it offers.
 *
 * @remarks Fenced code is stripped first: a fence showing a link is an example, not a reference, and
 * checking it would make the audit fail on documentation that is doing its job.
 *
 * @since 0.5.0
 */
export function scanMarkdownLinks(content: string): MarkdownLinkScan {
  const withoutFences = content.replaceAll(/^```[\s\S]*?^```/gm, (block) => block.replaceAll(/[^\n]/g, " "));
  const references: Array<MarkdownLinkReference> = [];

  for (const match of withoutFences.matchAll(/\[[^\]]*]\(\s*([^)\s]+?)\s*\)/g)) {
    const raw = match[1]!;
    if (EXTERNAL.test(raw)) {
      continue;
    }
    const hashAt = raw.indexOf("#");
    const targetPath = hashAt === -1 ? raw : raw.slice(0, hashAt);
    const anchor = hashAt === -1 ? null : raw.slice(hashAt + 1);
    if (targetPath === "" && anchor === null) {
      continue;
    }
    references.push({
      line: lineNumberAt(withoutFences, match.index),
      targetPath: decodeTarget(targetPath),
      anchor: anchor === null || anchor === "" ? null : decodeTarget(anchor),
    });
  }

  return { references, anchors: collectMarkdownAnchors(content) };
}

function decodeTarget(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function lineNumberAt(content: string, index: number): number {
  let line = 1;
  for (let position = 0; position < index; position++) {
    if (content.charCodeAt(position) === 10) {
      line++;
    }
  }
  return line;
}
