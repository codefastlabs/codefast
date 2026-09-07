/**
 * Builders for a `SourceRef` — the key of a file under `registry/<slug>/`. They
 * don't read content; `docs.ts` resolves a ref to raw text + highlighted HTML via
 * `getHighlightedSources`, so `doc.ts` modules stay free of embedded source.
 */
import type { SourceRef } from "#/registry/_core/types";

/** Ref to `registry/<slug>/<name>.example.tsx` — e.g. `docSource("button", "sizes")`. */
export function docSource(slug: string, name: string): SourceRef {
  return `../${slug}/${name}.example.tsx`;
}

/** Ref to `registry/<slug>/demo.tsx`, for docs that show the card demo as an example. */
export function docDemo(slug: string): SourceRef {
  return `../${slug}/demo.tsx`;
}

/** Ref to `registry/<slug>/usage.tsx` — a minimal, un-styled composition snippet. */
export function docUsage(slug: string): SourceRef {
  return `../${slug}/usage.tsx`;
}
