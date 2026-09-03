/**
 * The markdown documents a package may publish, in sidebar order. A kind is served from its `file`
 * at `packages/<pkg>/`, or from a directory there named after its `slug` — that directory's
 * `README.md` is the kind's own page and every other `*.md` under it a page beneath the kind. The
 * `slug` is the kind's URL segment under `/docs/<pkg>/`.
 */
export const DOC_KINDS = [
  { slug: "readme", file: "README.md", label: "Overview" },
  { slug: "spec", file: "SPEC.md", label: "Specification" },
  { slug: "architecture", file: "ARCHITECTURE.md", label: "Architecture" },
  { slug: "decisions", file: "DECISIONS.md", label: "Decisions" },
  { slug: "learning", file: "LEARNING.md", label: "Learning" },
  { slug: "contributing", file: "CONTRIBUTING.md", label: "Contributing" },
  { slug: "changelog", file: "CHANGELOG.md", label: "Changelog" },
] as const;

export type DocKind = (typeof DOC_KINDS)[number];
export type DocKindSlug = DocKind["slug"];

/** O(1) lookup of a kind by its URL segment. */
export const DOC_KIND_BY_SLUG: ReadonlyMap<string, DocKind> = new Map(DOC_KINDS.map((kind) => [kind.slug, kind]));

/** O(1) lookup of a kind by its file name, e.g. `SPEC.md`. */
export const DOC_KIND_BY_FILE: ReadonlyMap<string, DocKind> = new Map(DOC_KINDS.map((kind) => [kind.file, kind]));

/** A document's address within its package: the kind, and for a directory kind the page beneath it. */
export interface DocRef {
  readonly doc: DocKindSlug;
  /** The page's URL segment under the kind, e.g. `spec-consent` or `vectors`; absent for the kind's own page. */
  readonly page?: string | undefined;
}

/** Whether `slug` names a doc kind — narrows route params before they reach the server. */
export function isDocKindSlug(slug: string): slug is DocKindSlug {
  return DOC_KIND_BY_SLUG.has(slug);
}

/** Site path of a package document: the README at the package root, a kind under its slug, a kind's page under that. */
export function docPath(pkg: string, doc: DocKindSlug, page?: string): string {
  if (page) {
    return `/docs/${pkg}/${doc}/${page}`;
  }

  return doc === "readme" ? `/docs/${pkg}` : `/docs/${pkg}/${doc}`;
}

const INDEX_FILE = "README.md";

/**
 * The document a package-relative path publishes as, or `null` when it is not one.
 *
 * A kind's file at the package root — or the bare name of its directory — is the kind's own page.
 * Inside a kind's directory, `README.md` is that page too, and a page is one level deep: a `*.md`
 * directly inside is the page named after it without the extension, and `<dir>/README.md` is the
 * page `<dir>`. Both are lowercased for the URL; anything nested deeper is not a document.
 */
export function docRefFor(relativePath: string): DocRef | null {
  const slash = relativePath.indexOf("/");

  if (slash === -1) {
    const kind = DOC_KIND_BY_FILE.get(relativePath) ?? DOC_KIND_BY_SLUG.get(relativePath);

    return kind ? { doc: kind.slug } : null;
  }

  const kind = DOC_KIND_BY_SLUG.get(relativePath.slice(0, slash));
  const rest = relativePath.slice(slash + 1);

  if (!kind || !rest.endsWith(".md")) {
    return null;
  }

  if (rest === INDEX_FILE) {
    return { doc: kind.slug };
  }

  const page = rest.endsWith(`/${INDEX_FILE}`) ? rest.slice(0, -(INDEX_FILE.length + 1)) : rest.slice(0, -".md".length);

  return page.includes("/") ? null : { doc: kind.slug, page: page.toLowerCase() };
}
