import { defineEventCatalog } from "@codefast/tracking";
import type { ClientTracker } from "@codefast/tracking/client";
import { createClientTracker, createServerPersistedAnonymousId } from "@codefast/tracking/client";
import { createGoogleAnalyticsDestination, createVercelAnalyticsDestination } from "@codefast/tracking/destinations";
import { z } from "zod";

import {
  ANONYMOUS_ID_COOKIE_NAME,
  clearAnonymousIdCookie,
  persistAnonymousIdCookie,
} from "#/features/tracking/lib/anonymous-id";
import { isTrackingAllowed } from "#/features/tracking/lib/consent";

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

// A cookie (not `localStorage`-only) so a future server-owned event can read the same
// ID and correlate to this visitor. The client still mints it (lazily, post-consent);
// the server functions re-issue it via `Set-Cookie` so it outlives Safari ITP's 7-day
// cap on script-written cookies.
const anonymousId = createServerPersistedAnonymousId({
  clearOnServer: () => clearAnonymousIdCookie(),
  cookieName: ANONYMOUS_ID_COOKIE_NAME,
  persist: (id) => persistAnonymousIdCookie({ data: { id } }),
});

export function getOrCreateAnonymousId(): string {
  return anonymousId.getOrCreate();
}

/** Expires the anonymous-id cookie — called when the visitor withdraws analytics consent. */
export function clearAnonymousId(): void {
  anonymousId.clear();
}

let tracker: ClientTracker<typeof catalog> | undefined;

/**
 * Lazily creates the single shared client tracker. Safe to call from any client-only
 * code path (event handlers never run during SSR) without waiting on `<Analytics />`'s
 * own effect to run first.
 */
export function getTracker(): ClientTracker<typeof catalog> {
  tracker ??= createClientTracker({
    // a getOrCreate callback, not a value — the cookie must not exist until an event is actually allowed to send
    anonymousId: getOrCreateAnonymousId,
    catalog,
    // Vercel is cookieless and receives no identifier, so it keeps counting interactions
    // while consent gates GA — the same footing as its own native page views.
    // `createGoogleAnalyticsDestination`'s `send()` already no-ops until `<GoogleTag />`
    // mounts gtag.js, so no env-var check is needed here too.
    destinations: [createVercelAnalyticsDestination({ consent: "exempt" }), createGoogleAnalyticsDestination()],
    isTrackingAllowed,
    // no storage: with immediate-only destinations a persisted queue would never drain anywhere
  });

  return tracker;
}
