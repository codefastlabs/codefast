import { defineEventCatalog } from "@codefast/tracking";
import type { ClientTracker } from "@codefast/tracking/client";
import { createClientTracker, createServerPersistedAnonymousId } from "@codefast/tracking/client";
import { createGoogleAnalyticsDestination } from "@codefast/tracking/destinations";
import { createVercelAnalyticsDestination } from "@codefast/tracking/destinations/vercel-analytics";
// zod/mini: same schemas over Standard Schema at a fraction of zod classic's client bytes.
import * as z from "zod/mini";

import {
  ANONYMOUS_ID_COOKIE_NAME,
  clearAnonymousIdCookie,
  persistAnonymousIdCookie,
} from "#/features/tracking/lib/anonymous-id";
import { isAnalyticsAllowed } from "#/features/tracking/lib/visitor-consent";

/**
 * Custom events carry identifiers and metadata only — never free-form search text,
 * clipboard/markdown bodies, or full outbound URLs.
 */
export const catalog = defineEventCatalog({
  copy_code: {
    schema: z.object({
      kind: z.enum(["install-command", "setup-snippet", "usage-example"]),
      name: z.string(),
    }),
  },
  search_query: {
    schema: z.object({
      queryLength: z.number(),
    }),
  },
  select_search_result: {
    schema: z.object({
      resultType: z.enum(["page", "component"]),
      destination: z.optional(z.enum(["/", "/components", "/about"])),
      slug: z.optional(z.string()),
      hadQuery: z.boolean(),
      hasDemo: z.optional(z.boolean()),
    }),
  },
  copy_page: {
    schema: z.object({
      slug: z.string(),
      variant: z.enum(["markdown", "markdown-menu"]),
    }),
  },
  select_component: {
    schema: z.object({
      slug: z.string(),
      surface: z.enum(["gallery-sidebar", "gallery-card", "detail-sidebar"]),
    }),
  },
  open_external: {
    schema: z.object({
      destination: z.enum(["github", "github-issues", "npm", "chatgpt", "claude", "component-markdown"]),
      surface: z.enum(["header", "footer", "copy-page-menu"]),
      slug: z.optional(z.string()),
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

/** Expires the anonymous-id cookie — called when the visitor withdraws analytics consent. */
export function clearAnonymousId(): void {
  anonymousId.clear();
}

/**
 * Rolls an existing id's expiry forward (client write + one server `Set-Cookie` re-issue)
 * without ever minting — called once per load for consented returning visitors, so the id
 * survives Safari ITP. New visitors get their id at the first tracked interaction instead.
 */
export function refreshAnonymousId(): void {
  if (isAnalyticsAllowed()) {
    anonymousId.refresh();
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
    // a getOrCreate callback, not a value — the cookie must not exist until an event is actually allowed to send
    anonymousId: anonymousId.getOrCreate,
    catalog,
    // Vercel is cookieless and receives no identifier, so it keeps counting interactions
    // while consent gates GA — the same footing as its own native page views.
    // `createGoogleAnalyticsDestination`'s `send()` already no-ops until `<GoogleTag />`
    // mounts gtag.js, so no env-var check is needed here too.
    destinations: [
      createVercelAnalyticsDestination({ consentRequirement: "exempt" }),
      createGoogleAnalyticsDestination(),
    ],
    isAnalyticsAllowed,
    // Surface delivery failures in dev; a production deployment wires this to its monitor.
    onDeliveryError: ({ destination, error }) => {
      if (import.meta.env.DEV) {
        console.warn(`[tracking] destination "${destination.name}" failed to deliver`, error);
      }
    },
    // no storage: with immediate-only destinations a persisted queue would never drain anywhere
  });

  return tracker;
}

/**
 * Typed alias for `getTracker().track` — same catalog-coupled signature without reaching
 * through the lazy singleton at every call site.
 */
export const track: ClientTracker<typeof catalog>["track"] = (name, properties) => {
  getTracker().track(name, properties);
};
