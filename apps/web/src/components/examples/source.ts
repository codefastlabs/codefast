/**
 * Source refs for detail-page doc examples.
 *
 * These build the glob KEY of a file under `examples/` — they do not read
 * content. The registry (`docs.ts`) resolves a ref to its raw text + build-time
 * Shiki HTML (`?shiki`) when the doc's lazy chunk loads, so authored `.doc.ts`
 * modules stay free of embedded source strings and each component's sources
 * ship only with that component's chunk.
 */
import type { SourceRef } from "#/components/examples/types";

/** Ref to `examples/<slug>.<name>.tsx` — e.g. `docSource("button", "sizes")`, or `docSource(slug, "demo")` for the card demo. */
export function docSource(slug: string, name: string): SourceRef {
  return `./${slug}.${name}.tsx`;
}

/** Ref to the `examples/<slug>.anatomy.txt` composition skeleton. */
export function docAnatomy(slug: string): SourceRef {
  return `./${slug}.anatomy.txt`;
}
