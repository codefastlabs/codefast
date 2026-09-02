/**
 * The markdown documents a package may publish, in sidebar order. The `file` is the exact name under
 * `packages/<pkg>/`; the `slug` is its URL segment under `/docs/<pkg>/`.
 */
export const DOC_KINDS = [
  { slug: "readme", file: "README.md", label: "Overview" },
  { slug: "spec", file: "SPEC.md", label: "Specification" },
  { slug: "architecture", file: "ARCHITECTURE.md", label: "Architecture" },
  { slug: "decisions", file: "DECISIONS.md", label: "Decisions" },
  { slug: "learning", file: "LEARNING.md", label: "Learning" },
  { slug: "changelog", file: "CHANGELOG.md", label: "Changelog" },
] as const;

export type DocKind = (typeof DOC_KINDS)[number];
export type DocKindSlug = DocKind["slug"];

/** O(1) lookup of a kind by its URL segment. */
export const DOC_KIND_BY_SLUG: ReadonlyMap<string, DocKind> = new Map(DOC_KINDS.map((kind) => [kind.slug, kind]));

/** O(1) lookup of a kind by its file name, e.g. `SPEC.md`. */
export const DOC_KIND_BY_FILE: ReadonlyMap<string, DocKind> = new Map(DOC_KINDS.map((kind) => [kind.file, kind]));

/** Whether `slug` names a doc kind — narrows route params before they reach the server. */
export function isDocKindSlug(slug: string): slug is DocKindSlug {
  return DOC_KIND_BY_SLUG.has(slug);
}

/** Site path of a package document: the README lives at the package root, every other kind under its slug. */
export function docPath(pkg: string, doc: DocKindSlug): string {
  return doc === "readme" ? `/docs/${pkg}` : `/docs/${pkg}/${doc}`;
}
