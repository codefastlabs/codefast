/**
 * Source refs for detail-page doc examples.
 *
 * These build the glob KEY of a file under `registry/<slug>/` — they do not
 * read content. The registry (`docs.ts`) resolves a ref to its raw text +
 * build-time Shiki HTML (`?shiki`) when the doc's lazy chunk loads, so authored
 * `doc.ts` modules stay free of embedded source strings and each component's
 * sources ship only with that component's chunk.
 */
import type { SourceRef } from "#/registry/types";

/** Ref to `registry/<slug>/<name>.example.tsx` — e.g. `docSource("button", "sizes")`. */
export function docSource(slug: string, name: string): SourceRef {
  return `./${slug}/${name}.example.tsx`;
}

/** Ref to `registry/<slug>/demo.tsx`, for docs that show the card demo as an example. */
export function docDemo(slug: string): SourceRef {
  return `./${slug}/demo.tsx`;
}

/** Ref to the `registry/<slug>/anatomy.txt` composition skeleton. */
export function docAnatomy(slug: string): SourceRef {
  return `./${slug}/anatomy.txt`;
}
