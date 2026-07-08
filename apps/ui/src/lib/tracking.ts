import { defineEventCatalog } from "@codefast/tracking";
import type { ClientTracker } from "@codefast/tracking/client";
import { createClientTracker } from "@codefast/tracking/client";
import { createGoogleAnalyticsDestination, createVercelAnalyticsDestination } from "@codefast/tracking/destinations";
import { z } from "zod";

import { isTrackingAllowed } from "#/lib/consent-state";

/**
 * `copy_code`/`search_query` track *what* was copied or searched, never the raw
 * code content or the full clipboard value — only identifiers/metadata.
 */
export const catalog = defineEventCatalog({
  copy_code: {
    owner: "client",
    schema: z.object({
      kind: z.enum(["install-command", "setup-snippet", "usage-example"]),
      name: z.string(),
    }),
  },
  search_query: {
    owner: "client",
    schema: z.object({
      query: z.string(),
      queryLength: z.number(),
    }),
  },
});

const ANONYMOUS_ID_COOKIE = "codefast-ui-anon-id";
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

/**
 * A cookie (not `localStorage`-only) so a future server-owned event can read the same
 * ID and correlate to this visitor.
 */
export function getOrCreateAnonymousId(): string {
  const existing = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${ANONYMOUS_ID_COOKIE}=`))
    ?.split("=")[1];

  if (existing) {
    return existing;
  }

  const id = crypto.randomUUID();

  document.cookie = `${ANONYMOUS_ID_COOKIE}=${id}; path=/; max-age=${ONE_YEAR_IN_SECONDS}; samesite=lax`;

  return id;
}

/** Expires the anonymous-id cookie — called when the visitor withdraws analytics consent. */
export function clearAnonymousId(): void {
  document.cookie = `${ANONYMOUS_ID_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

/**
 * Expires Google's `_ga`/`_ga_*` cookies — Consent Mode stops using them once denied
 * but never removes them, and a withdrawal must not leave identifier cookies behind.
 */
export function clearGoogleAnalyticsCookies(): void {
  const { hostname } = globalThis.location;

  for (const cookie of document.cookie.split("; ")) {
    const name = cookie.split("=")[0];

    if (name !== undefined && (name === "_ga" || name.startsWith("_ga_"))) {
      // GA sets its cookies on the broadest domain it can reach — expire both variants.
      document.cookie = `${name}=; path=/; max-age=0`;
      document.cookie = `${name}=; path=/; max-age=0; domain=.${hostname}`;
    }
  }
}

let tracker: ClientTracker<typeof catalog> | undefined;

/**
 * Lazily creates the single shared client tracker. Safe to call from any client-only
 * code path (event handlers never run during SSR) without waiting on `<Analytics />`'s
 * own effect to run first.
 */
export function getTracker(): ClientTracker<typeof catalog> {
  tracker ??= createClientTracker({
    // a resolver, not a value — the cookie must not exist until an event is actually allowed to send
    anonymousId: getOrCreateAnonymousId,
    catalog,
    // `createGoogleAnalyticsDestination`'s `send()` already no-ops until `<GoogleTag />`
    // mounts gtag.js, so no env-var check is needed here too.
    destinations: [createVercelAnalyticsDestination(), createGoogleAnalyticsDestination()],
    isTrackingAllowed,
    // no storage: with immediate-only destinations a persisted queue would never drain anywhere
  });

  return tracker;
}
