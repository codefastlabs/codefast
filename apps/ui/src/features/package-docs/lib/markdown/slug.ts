/**
 * GitHub-style heading ids, matching the rule `codefast audit links` checks anchors against: lowercase,
 * drop everything but letters, numbers, spaces and hyphens, then hyphenate spaces. Duplicates take
 * `-1`, `-2`… like GitHub.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replaceAll(/[^\p{L}\p{N} -]/gu, "")
    .trim()
    .replaceAll(/\s+/g, "-");
}

/** Hands out unique ids for one document's headings. */
export class Slugger {
  readonly #seen = new Map<string, number>();

  slug(text: string): string {
    const base = slugify(text);
    const count = this.#seen.get(base) ?? 0;

    this.#seen.set(base, count + 1);

    return count === 0 ? base : `${base}-${count}`;
  }
}

/** Heading text with inline markdown removed, for TOC labels and the page title. */
export function plainHeadingText(text: string): string {
  return text
    .replaceAll(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replaceAll(/`([^`]*)`/g, "$1")
    .replaceAll(/[*_~]+/g, "")
    .trim();
}
