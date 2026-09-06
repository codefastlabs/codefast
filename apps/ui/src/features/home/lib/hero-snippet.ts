import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";

import { CONTENT_CACHE_HEADERS } from "#/lib/cache";

/**
 * The hero's `@codefast/di` sample, highlighted on the server so Shiki never reaches a client chunk. A GET with the
 * content-cache headers: prerendering bakes it into the home page, and a client-side visit hits the CDN.
 */
export const getHeroSnippet = createServerFn({ method: "GET" }).handler(async (): Promise<string> => {
  for (const [name, value] of Object.entries(CONTENT_CACHE_HEADERS)) {
    setResponseHeader(name, value);
  }

  const { highlightHeroSnippet } = await import("#/features/home/lib/hero-snippet.impl");

  return highlightHeroSnippet();
});
