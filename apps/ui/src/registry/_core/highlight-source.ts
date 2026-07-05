/**
 * Highlights a registry source at build time. `staticFunctionMiddleware` runs the
 * handler during prerender and caches the result as static JSON, so the Shiki
 * engine (in `highlight-source.impl`, imported only inside the handler) never
 * reaches a client chunk.
 */
import { createServerFn } from "@tanstack/react-start";
import { staticFunctionMiddleware } from "@tanstack/start-static-server-functions";

import type { HighlightedSource } from "#/lib/highlight";
import type { SourceRef } from "#/registry/_core/types";

/** Resolves a registry source ref to its raw text + pre-highlighted HTML. */
export const getHighlightedSource = createServerFn({ method: "GET" })
  .validator((ref: SourceRef): SourceRef => ref)
  // must be the final middleware
  .middleware([staticFunctionMiddleware])
  .handler(async ({ data: ref }): Promise<HighlightedSource> => {
    const { highlightSource } = await import("#/registry/_core/highlight-source.impl");

    return highlightSource(ref);
  });
