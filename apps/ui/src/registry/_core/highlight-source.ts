/**
 * Highlights a batch of registry sources on the server. The Shiki engine (in
 * `highlight-source.impl`, imported only inside the handler) never reaches a client
 * chunk. A GET with the content-cache headers, so the CDN caches each unique batch
 * under the same ISR policy as the pages — after the first visitor, client-side
 * navigations hit the edge, not Shiki. Batched by ref so a doc with N examples costs
 * one round trip, not N.
 */
import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";

import { CONTENT_CACHE_HEADERS } from "#/lib/cache";
import type { HighlightedSource } from "#/registry/_core/highlight";
import type { SourceRef } from "#/registry/_core/types";

/** Resolves registry source refs to their raw text + pre-highlighted HTML. */
export const getHighlightedSources = createServerFn({ method: "GET" })
  .validator((refs: ReadonlyArray<SourceRef>): ReadonlyArray<SourceRef> => refs)
  .handler(async ({ data: refs }): Promise<Record<SourceRef, HighlightedSource>> => {
    for (const [name, value] of Object.entries(CONTENT_CACHE_HEADERS)) {
      setResponseHeader(name, value);
    }

    const { highlightSources } = await import("#/registry/_core/highlight-source.impl");

    return highlightSources(refs);
  });
