/**
 * Highlights a batch of registry sources at build time. `staticFunctionMiddleware`
 * runs the handler during prerender and caches the result as static JSON, so the
 * Shiki engine (in `highlight-source.impl`, imported only inside the handler) never
 * reaches a client chunk. Batched by ref so a doc with N examples costs one round
 * trip, not N.
 */
import { createServerFn } from "@tanstack/react-start";
import { staticFunctionMiddleware } from "@tanstack/start-static-server-functions";

import type { HighlightedSource } from "#/registry/_core/highlight";
import type { SourceRef } from "#/registry/_core/types";

/** Resolves registry source refs to their raw text + pre-highlighted HTML. */
export const getHighlightedSources = createServerFn({ method: "GET" })
  .validator((refs: ReadonlyArray<SourceRef>): ReadonlyArray<SourceRef> => refs)
  // must be the final middleware
  .middleware([staticFunctionMiddleware])
  .handler(async ({ data: refs }): Promise<Record<SourceRef, HighlightedSource>> => {
    const { highlightSources } = await import("#/registry/_core/highlight-source.impl");

    return highlightSources(refs);
  });
