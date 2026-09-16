/**
 * GitHub's heading-slug rule: lowercase, strip to letters, numbers, marks, underscore and hyphen, then
 * turn each remaining space into a hyphen with runs left intact. Rendering ids off the same rule the
 * link audit enforces keeps an in-doc link that passes the audit working on the page.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replaceAll(/[^\p{L}\p{N}\p{M} _-]/gu, "")
    .trim()
    .replaceAll(" ", "-");
}

/** Hands out unique ids for one document's headings, suffixing duplicates `-1`, `-2`… like GitHub. */
export class Slugger {
  readonly #seen = new Map<string, number>();

  slug(text: string): string {
    const base = slugify(text);
    let result = base;

    while (this.#seen.has(result)) {
      this.#seen.set(base, (this.#seen.get(base) ?? 0) + 1);
      result = `${base}-${this.#seen.get(base)!}`;
    }

    this.#seen.set(result, 0);

    return result;
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
