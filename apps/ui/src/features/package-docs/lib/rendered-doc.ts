import type { TocItem } from "#/features/components-catalog/components/detail/toc";
/**
 * The serialisable shape of a package document after rendering — what a route loader ships to the
 * client, so nothing here may reference the markdown or highlighter engines.
 */
import type { DocKindSlug } from "#/features/package-docs/lib/doc-kinds";

/** A published package as the landing page and docs sidebar describe it. */
export interface PackageSummary {
  /** Directory name under `packages/`, and the URL segment under `/docs/`. */
  readonly slug: string;
  /** The npm name, e.g. `@codefast/di`. */
  readonly name: string;
  readonly description: string;
  readonly version: string;
  /** SPDX id from the manifest, e.g. `MIT`. */
  readonly license: string;
  /** The document kinds the package ships, in `DOC_KINDS` order. */
  readonly docs: ReadonlyArray<DocKindSlug>;
}

/** One markdown document rendered to HTML. */
export interface RenderedDoc {
  readonly pkg: string;
  readonly doc: DocKindSlug;
  /** The first `#` heading, or the kind's label. */
  readonly title: string;
  /** Dual-theme HTML: heading ids, rewritten links, Shiki code blocks. */
  readonly html: string;
  /** `##` and `###` headings, for the "On this page" rail. */
  readonly toc: ReadonlyArray<TocItem>;
}

/** Everything a doc page needs: the document plus the index that draws the sidebar. */
export interface DocPage {
  readonly doc: RenderedDoc;
  readonly packages: ReadonlyArray<PackageSummary>;
}
