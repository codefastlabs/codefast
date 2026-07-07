import { defineEventCatalog } from "@codefast/tracking";
import type { ClientTracker } from "@codefast/tracking/client";
import { createClientTracker, createLocalStorageQueueStorage } from "@codefast/tracking/client";
import type { Destination } from "@codefast/tracking/core/destination";
import {
  createGoogleAdsConversionDestination,
  createGoogleAnalyticsDestination,
  createVercelAnalyticsDestination,
} from "@codefast/tracking/destinations";
import { z } from "zod";

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

/**
 * GA4/Ads destinations only make sense once `<GoogleTag />` has mounted the gtag.js
 * snippet for the configured measurement ID — omit the env var and both stay absent,
 * so a preview/dev deploy with no real Google account never emits gtag calls.
 */
function googleDestinations(): Array<Destination> {
  const destinations: Array<Destination> = [];

  if (import.meta.env.VITE_GA4_MEASUREMENT_ID) {
    destinations.push(createGoogleAnalyticsDestination());
  }

  if (import.meta.env.VITE_GOOGLE_ADS_SEND_TO) {
    destinations.push(
      createGoogleAdsConversionDestination({
        conversions: { copy_code: { sendTo: import.meta.env.VITE_GOOGLE_ADS_SEND_TO } },
      }),
    );
  }

  return destinations;
}

let tracker: ClientTracker<typeof catalog> | undefined;

/**
 * Lazily creates the single shared client tracker. Safe to call from any client-only
 * code path (event handlers never run during SSR) without waiting on `<Analytics />`'s
 * own effect to run first.
 */
export function getTracker(): ClientTracker<typeof catalog> {
  tracker ??= createClientTracker({
    anonymousId: getOrCreateAnonymousId(),
    catalog,
    destinations: [createVercelAnalyticsDestination(), ...googleDestinations()],
    storage: createLocalStorageQueueStorage("codefast-ui-tracking-queue"),
  });

  return tracker;
}
