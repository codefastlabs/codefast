/**
 * Source refs for detail-page doc examples.
 *
 * These build the glob KEY of a file under `docs/` — they do not read content.
 * The registry (`docs/index.ts`) resolves a ref to its raw text + build-time
 * Shiki HTML (`?shiki`) when the doc's lazy chunk loads, so authored `.doc.ts`
 * modules stay free of embedded source strings and each component's sources
 * ship only with that component's chunk.
 */
import type { SourceRef } from "#/components/examples/docs/types";

/** Ref to `docs/<slug>/<name>.tsx`. */
export function docSource(slug: string, name: string): SourceRef {
  return `./${slug}/${name}.tsx`;
}

/** Ref to the `docs/<slug>/anatomy.txt` composition skeleton. */
export function docAnatomy(slug: string): SourceRef {
  return `./${slug}/anatomy.txt`;
}
