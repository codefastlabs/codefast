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
 * @remarks Slugs follow GitHub's own algorithm so a link that resolves on GitHub resolves here.
 * Repeated slugs take a `-1`, `-2`, … suffix in heading order, exactly as GitHub disambiguates them,
 * so a link to the second copy of a heading resolves instead of reading as dangling.
 *
 * @since 0.5.0
 */
export function collectMarkdownAnchors(content: string): Set<string> {
  const anchors = new Set<string>();

  for (const match of content.matchAll(/<a\s+id="([^"]+)"\s*><\/a>/g)) {
    anchors.add(match[1]!);
  }

  const occurrences = new Map<string, number>();
  for (const match of content.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)) {
    const base = slugifyHeading(match[1]!);
    let result = base;
    while (occurrences.has(result)) {
      occurrences.set(base, (occurrences.get(base) ?? 0) + 1);
      result = `${base}-${occurrences.get(base)!}`;
    }
    occurrences.set(result, 0);
    anchors.add(result);
  }

  return anchors;
}

/**
 * A heading's GitHub slug: lowercased, stripped to letters, numbers, marks, underscore and hyphen,
 * with each remaining space turned into a hyphen — runs are kept, not collapsed, matching GitHub.
 */
function slugifyHeading(heading: string): string {
  return heading
    .toLowerCase()
    .replaceAll(/[^\p{L}\p{N}\p{M} _-]/gu, "")
    .replaceAll(" ", "-");
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
