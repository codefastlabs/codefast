import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";

import type { LedgerFacts } from "#/features/home/lib/benchmark-ledger-facts";
import { CONTENT_CACHE_HEADERS } from "#/lib/cache";

/**
 * What the benchmark ledger says about its own runs, read on the server so the markdown never reaches a client
 * chunk. A GET with the content-cache headers: prerendering bakes it into the home page, a client visit hits the CDN.
 */
export const getBenchmarkLedger = createServerFn({ method: "GET" }).handler(async (): Promise<LedgerFacts> => {
  for (const [name, value] of Object.entries(CONTENT_CACHE_HEADERS)) {
    setResponseHeader(name, value);
  }

  const { readLedgerFacts } = await import("#/features/home/lib/benchmark-ledger.impl");

  return readLedgerFacts();
});
