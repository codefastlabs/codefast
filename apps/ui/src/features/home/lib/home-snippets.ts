import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";

import { CONTENT_CACHE_HEADERS } from "#/lib/cache";

/** The home page's code samples as dual-theme highlighted HTML. */
export interface HomeSnippets {
  /** The `@codefast/di` quick start shown in the hero. */
  readonly quickStart: string;
  /** The `@codefast/di-testing` unit test shown in the testing section. */
  readonly testBed: string;
}

/**
 * The home page's code samples, highlighted on the server so Shiki never reaches a client chunk. A GET with the
 * content-cache headers: prerendering bakes them into the home page, and a client-side visit hits the CDN.
 */
export const getHomeSnippets = createServerFn({ method: "GET" }).handler(async (): Promise<HomeSnippets> => {
  for (const [name, value] of Object.entries(CONTENT_CACHE_HEADERS)) {
    setResponseHeader(name, value);
  }

  const { highlightHomeSnippets } = await import("#/features/home/lib/home-snippets.impl");

  return highlightHomeSnippets();
});
