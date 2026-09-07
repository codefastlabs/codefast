import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";

import { CONTENT_CACHE_HEADERS } from "#/lib/cache";

/** A sample with its import block split off, so a card can fold the imports and start at the code that matters. */
export interface FoldedSnippet {
  /** The import block as dual-theme highlighted HTML. */
  readonly imports: string;
  /** Everything after the imports as dual-theme highlighted HTML. */
  readonly body: string;
}

/** The testing sample split for its tabbed card: the import block, then one entry per `it(...)` in file order. */
export interface TestBedSnippet {
  /** The import block as dual-theme highlighted HTML. */
  readonly imports: string;
  /** Each test's title as the sample states it, with its body as dual-theme highlighted HTML. */
  readonly tests: ReadonlyArray<{ readonly title: string; readonly html: string }>;
}

/** The home page's code samples as dual-theme highlighted HTML. */
export interface HomeSnippets {
  /** The `@codefast/di` quick start shown in the hero. */
  readonly quickStart: string;
  /** The `@codefast/di-testing` tests over the live shop's OrderService, split for the testing section's card. */
  readonly testBed: TestBedSnippet;
  /** The quick start's OrderService with its list right, which the typed-tokens card opens on. */
  readonly rightList: string;
  /** The same class naming the shop's config token, which the typed-tokens card shows with the compiler's verdict. */
  readonly wrongList: string;
  /** Every decorator in one class for the decorators card, its import block split off. */
  readonly decorators: FoldedSnippet;
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
