/**
 * The raw-Markdown twin of a doc page, shared by the `.md` server routes. Imports the source
 * module lazily: server routes run only on the server, but the raw documents still have no business
 * in the route module graph.
 */
import { isDocKindSlug } from "#/features/package-docs/lib/doc-kinds";
import { CONTENT_CACHE_CONTROL, CONTENT_CDN_CACHE_CONTROL } from "#/lib/cache";

export async function rawDocResponse(pkg: string, doc: string, page?: string): Promise<Response> {
  if (!isDocKindSlug(doc)) {
    return new Response("Not found", { status: 404 });
  }

  const { docSource } = await import("#/features/package-docs/lib/doc-source.impl");
  const source = docSource(pkg, doc, page);

  if (!source) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(await source.load(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": CONTENT_CACHE_CONTROL,
      "CDN-Cache-Control": CONTENT_CDN_CACHE_CONTROL,
    },
  });
}
