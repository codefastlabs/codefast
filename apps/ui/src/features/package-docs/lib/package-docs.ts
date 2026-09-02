/**
 * The server functions behind the landing page and `/docs/*`. The manifests, raw markdown, and the
 * rendering engines are imported only inside the handlers, so they never reach a client chunk; every
 * page that calls these is prerendered, and a client-side navigation hits the CDN-cached GET.
 */
import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";

import { isDocKindSlug } from "#/features/package-docs/lib/doc-kinds";
import type { DocKindSlug } from "#/features/package-docs/lib/doc-kinds";
import type { DocPage, PackageSummary, RenderedDoc } from "#/features/package-docs/lib/rendered-doc";
import { CONTENT_CACHE_HEADERS } from "#/lib/cache";

function setContentCacheHeaders(): void {
  for (const [name, value] of Object.entries(CONTENT_CACHE_HEADERS)) {
    setResponseHeader(name, value);
  }
}

/** Renders one package document, or `null` when the package or kind does not exist. */
export async function renderDoc(pkg: string, doc: DocKindSlug): Promise<RenderedDoc | null> {
  const [{ docKind, loadRawDoc }, { renderMarkdown }] = await Promise.all([
    import("#/features/package-docs/lib/doc-source.impl"),
    import("#/features/package-docs/lib/markdown/render.impl"),
  ]);
  const source = await loadRawDoc(pkg, doc);

  if (source === null) {
    return null;
  }

  const kind = docKind(doc);
  const rendered = await renderMarkdown(source, { pkg, file: kind.file });

  return { pkg, doc, title: rendered.title ?? kind.label, html: rendered.html, toc: rendered.toc };
}

/** Every published package with its version, description, and the documents it ships. */
export const getPackages = createServerFn({ method: "GET" }).handler(
  async (): Promise<ReadonlyArray<PackageSummary>> => {
    setContentCacheHeaders();

    const { PACKAGES } = await import("#/features/package-docs/lib/doc-source.impl");

    return PACKAGES;
  },
);

/** A `/docs/<pkg>[/<doc>]` page: the rendered document plus the sidebar index, or `null` for an unknown target. */
export const getDocPage = createServerFn({ method: "GET" })
  .validator((input: { pkg: string; doc: string }): { pkg: string; doc: string } => input)
  .handler(async ({ data }): Promise<DocPage | null> => {
    setContentCacheHeaders();

    if (!isDocKindSlug(data.doc)) {
      return null;
    }

    const [{ DOC_PACKAGES }, doc] = await Promise.all([
      import("#/features/package-docs/lib/doc-source.impl"),
      renderDoc(data.pkg, data.doc),
    ]);

    return doc ? { doc, packages: DOC_PACKAGES } : null;
  });
