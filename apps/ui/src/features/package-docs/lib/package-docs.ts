/**
 * The server functions behind the landing page and `/docs/*`. The manifests, raw markdown, and the
 * rendering engines are imported only inside the handlers, so they never reach a client chunk; every
 * page that calls these is prerendered, and a client-side navigation hits the CDN-cached GET.
 */
import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";

import { isDocKindSlug } from "#/features/package-docs/lib/doc-kinds";
import type { DocKindSlug } from "#/features/package-docs/lib/doc-kinds";
import { CHANGELOG_RELEASES_SHOWN, trimChangelog } from "#/features/package-docs/lib/markdown/trim-changelog";
import type { DocPageData, PackageSummary, RenderedDoc } from "#/features/package-docs/lib/rendered-doc";
import { repoBlobUrl } from "#/features/package-docs/lib/site";
import { CONTENT_CACHE_HEADERS } from "#/lib/cache";

/** The address of a doc page as the route params carry it; `page` is present only under a directory kind. */
interface DocPageParams {
  readonly pkg: string;
  readonly kind: string;
  readonly page?: string | undefined;
}

function setContentCacheHeaders(): void {
  for (const [name, value] of Object.entries(CONTENT_CACHE_HEADERS)) {
    setResponseHeader(name, value);
  }
}

/** The latest releases of a changelog, closing with a pointer to the full file when releases were cut. */
function trimmedChangelog(source: string, pkg: string, file: string): string {
  const { source: kept, omitted } = trimChangelog(source);

  if (omitted === 0) {
    return kept;
  }

  const more = omitted === 1 ? "one more release" : `${omitted} more releases`;

  return `${kept}\n\n---\n\n_Showing the latest ${CHANGELOG_RELEASES_SHOWN} releases; the [full changelog](${repoBlobUrl(`packages/${pkg}/${file}`)}) on GitHub has ${more}._\n`;
}

/** Renders one package document, or `null` when the package, kind, or page does not exist. */
export async function renderDoc(pkg: string, kind: DocKindSlug, page?: string): Promise<RenderedDoc | null> {
  const [{ docKind, docSource }, { renderMarkdown }] = await Promise.all([
    import("#/features/package-docs/lib/doc-source.impl"),
    import("#/features/package-docs/lib/markdown/render.impl"),
  ]);
  const source = docSource(pkg, kind, page);

  if (!source) {
    return null;
  }

  const raw = await source.load();
  // Only the package's own changelog is trimmed; a changelog page inside a directory kind renders whole.
  const body = kind === "changelog" && page === undefined ? trimmedChangelog(raw, pkg, source.file) : raw;
  const rendered = await renderMarkdown(body, { pkg, file: source.file });

  return {
    pkg,
    kind,
    page,
    file: source.file,
    title: rendered.title ?? page ?? docKind(kind).label,
    html: rendered.html,
    toc: rendered.toc,
  };
}

/** Every published package with its version, description, and the documents it ships. */
export const getPackages = createServerFn({ method: "GET" }).handler(
  async (): Promise<ReadonlyArray<PackageSummary>> => {
    setContentCacheHeaders();

    const { PACKAGES } = await import("#/features/package-docs/lib/doc-source.impl");

    return PACKAGES;
  },
);

/** A `/docs/<pkg>[/<kind>[/<page>]]` page: the rendered document plus the sidebar index, or `null` for an unknown target. */
export const getDocPage = createServerFn({ method: "GET" })
  .validator((params: DocPageParams): DocPageParams => params)
  .handler(async ({ data }): Promise<DocPageData | null> => {
    setContentCacheHeaders();

    if (!isDocKindSlug(data.kind)) {
      return null;
    }

    const [{ DOC_PACKAGES }, doc] = await Promise.all([
      import("#/features/package-docs/lib/doc-source.impl"),
      renderDoc(data.pkg, data.kind, data.page),
    ]);

    return doc ? { doc, packages: DOC_PACKAGES } : null;
  });
