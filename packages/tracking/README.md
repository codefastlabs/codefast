# @codefast/tracking

Fullstack, type-safe event tracking for TanStack Start apps. Each app defines its own
event catalog over any [Standard Schema](https://standardschema.dev) library (zod,
`zod/mini`, valibot, ...) tagged with an owner (`"client"` or `"server"`); trackers built
from that catalog only allow firing events owned by that side — enforced at compile time.
The package itself depends only on the spec's types, so the client bundle pays for the
schema library the app already ships (`zod/mini` keeps it smallest).

See [SPEC.md](./SPEC.md) for the full design (identity correlation, offline queue/retry,
multi-destination fan-out, region-based consent).

## Status

Early scaffold. `core`, `client`, `server`, and `react` (headless consent) implement the
shapes described in the spec. `createVercelAnalyticsDestination`,
`createGoogleAnalyticsDestination`, `createGoogleTagManagerDestination`, and
`createGa4MeasurementProtocolDestination` are implemented; PostHog is not built yet — use
`createHttpDestination` or implement the `Destination` interface directly.

## Quick start

```ts
import { defineEventCatalog } from "@codefast/tracking";
import {
  createClientTracker,
  createCookieAnonymousId,
  createLocalStorageQueueStorage,
} from "@codefast/tracking/client";
import { createHttpDestination } from "@codefast/tracking/destinations";
import { z } from "zod";

export const catalog = defineEventCatalog({
  button_clicked: { owner: "client", schema: z.object({ id: z.string() }) },
  order_completed: { owner: "server", schema: z.object({ orderId: z.string(), amount: z.number() }) },
});

const anonymousId = createCookieAnonymousId({ cookieName: "app-anonymous-id" });

const tracker = createClientTracker({
  // A getOrCreate callback, not a plain string — invoked only once an event is actually
  // allowed to send, so the id is never minted as an import-time side effect.
  anonymousId: anonymousId.getOrCreate,
  catalog,
  destinations: [createHttpDestination({ name: "internal", endpoint: "/api/events" })],
  storage: createLocalStorageQueueStorage("tracking-queue"),
});

tracker.track("button_clicked", { id: "cta" });
// tracker.track("order_completed", { orderId: "o1", amount: 10 }); // compile error — server-owned
```

```ts
import { createServerTracker } from "@codefast/tracking/server";

const serverTracker = createServerTracker({
  catalog,
  destinations: [
    /* ... */
  ],
});

await serverTracker.track("order_completed", { orderId: "o1", amount: 10 }, { anonymousId, userId });
```

## Durable anonymous id ("client mints, server persists")

Safari ITP caps `document.cookie`-written cookies at 7 days, so a purely client-written
anonymous id silently churns weekly there. `createServerPersistedAnonymousId` keeps the
consent-first client-side minting and delegates the durable write to your server, which
re-issues the cookie via `Set-Cookie` (and rolls its expiry forward on every visit). The
server helpers are framework-agnostic strings — wire them to a TanStack Start server
function, a Next.js Route Handler, or anything that can set a response header. They throw
on any non-UUID id, so the public persist endpoint can never echo attacker input into a
header. The server persists and prolongs; it never mints — an unconditional server-set id
would predate consent.

```ts
// server function / route handler
import { buildAnonymousIdSetCookie, buildClearAnonymousIdSetCookie } from "@codefast/tracking/server";

// TanStack Start: setResponseHeader("set-cookie", buildAnonymousIdSetCookie({ cookieName, id }))
// Next.js:       new Response(null, { status: 204, headers: { "set-cookie": buildAnonymousIdSetCookie({ cookieName, id }) } })
```

```ts
// client — drop-in for createCookieAnonymousId
import { createServerPersistedAnonymousId } from "@codefast/tracking/client";

const anonymousId = createServerPersistedAnonymousId({
  cookieName: "app-anonymous-id",
  persist: (id) => persistAnonymousIdCookie({ data: { id } }), // your server round-trip
  clearOnServer: () => clearAnonymousIdCookie(), // consent-withdrawal half
});
```

## Router page views + unload flush

`attachRouterPageTracking` is duck-typed against `Router["subscribe"]`, so it takes a real
`@tanstack/react-router` instance without this package depending on it. The queue schedules
its own flushes — batch-size threshold plus a one-shot idle timer armed only while events
are pending (an idle page runs no timer), paused while `navigator.onLine` reports offline
so the retry budget survives a dead connection. `attachClientLifecycle` adds the triggers
the queue can't own: end-of-session delivery on hide/pagehide (`sendBeacon` to
`beaconEndpoint`, or a keepalive `fetch` flush without one) and an immediate flush when
connectivity returns.

```ts
import { attachClientLifecycle, attachRouterPageTracking } from "@codefast/tracking/client";

attachRouterPageTracking(tracker, router); // router: your app's TanStack Router instance
attachClientLifecycle(tracker, { beaconEndpoint: "/api/events" });
```

Skip both helpers when every destination is `delivery: "immediate"` (gtag, Vercel) and
page views come from GA4 Enhanced Measurement — there is nothing to flush.

## Consent (region-based, per-category)

Consent is granular per purpose, mirroring Google Consent Mode v2's split: a
`ConsentDecision` is `{ ads: boolean, analytics: boolean }`, never a single yes/no —
GDPR requires purpose-level consent, and the ads signals (`ad_storage`/`ad_user_data`/
`ad_personalization`) must be able to differ from `analytics_storage`.

Resolve the region/mode server-side (`resolveRegion` + `resolveConsentMode` from
`@codefast/tracking/server` and `@codefast/tracking`) and pass `mode` down to the client.
The banner ships as composable, headless parts — no `@codefast/ui` dependency, any
markup (including a design system's button styles via `className`) slots in. For a
default look without writing CSS, import the optional plain-CSS theme:

```css
@import "@codefast/tracking/css/consent.css";
```

Or style the parts yourself via `className`/`data-slot` attributes (`consent-banner`,
`consent-title`, `consent-description`, `consent-actions`, `consent-action`,
`consent-preferences`, `consent-category`, `consent-category-checkbox`,
`consent-toggle`), e.g. Tailwind's
`**:data-[slot=consent-action]:rounded-md`. `data-state` on the root flips between
`prompt` and `preferences`.

```tsx
import {
  createConsentWithdrawalHandler,
  createIsAnalyticsAllowed,
  createLocalStorageConsentStorage,
  hasGlobalPrivacyControlSignal,
} from "@codefast/tracking/client";
import { clearGoogleAnalyticsCookies, loadGtagScript } from "@codefast/tracking/destinations";
import {
  ConsentBanner,
  ConsentBannerAccept,
  ConsentBannerActions,
  ConsentBannerCategory,
  ConsentBannerCustomize,
  ConsentBannerDescription,
  ConsentBannerPreferences,
  ConsentBannerReject,
  ConsentBannerSave,
  ConsentBannerTitle,
  ConsentToggle,
  useConsent,
  useGoogleConsentSync,
} from "@codefast/tracking/react";

// Module scope — useConsent subscribes to the storage, so it must be a stable reference.
const consentStorage = createLocalStorageConsentStorage("tracking-consent");
const requestedCategories = ["analytics"] as const;
const policyVersion = "2026-01";

// Prefer a re-readable snapshot from your server-fn lane (apps/ui `visitor-consent.ts`).
// Fail closed to opt-in until that resolve lands.
const isAnalyticsAllowed = createIsAnalyticsAllowed({
  hasGlobalPrivacyControlSignal,
  getMode: () => "opt-in",
  policyVersion,
  requestedCategories,
  storage: consentStorage,
});

const onDecision = createConsentWithdrawalHandler({
  clearAnonymousId: anonymousId.clear,
  clearGoogleAnalyticsCookies,
  clearTracker: () => tracker.clear(),
});

function ConsentGate({ mode }: { mode: "opt-in" | "opt-out" }) {
  const consent = useConsent({
    mode,
    onDecision,
    policyVersion,
    requestedCategories, // Accept grants exactly these — never unrequested purposes
    storage: consentStorage,
  });

  // Mount once on a page-wide surface so privacy-page / cross-tab decisions sync to gtag.
  useGoogleConsentSync(consent, {
    loadGtagScript: () => loadGtagScript({ gaMeasurementId: "G-XXXXXXX" }),
  });

  return mode === "opt-in" ? (
    <ConsentBanner consent={consent}>
      <ConsentBannerTitle>Cookies &amp; analytics</ConsentBannerTitle>
      <ConsentBannerDescription>
        We use cookies to understand how you use this site. <a href="/privacy">Privacy policy</a>
      </ConsentBannerDescription>
      {/* optional second layer: per-category checkboxes ("Customize" → "Save preferences") */}
      <ConsentBannerPreferences>
        <ConsentBannerCategory category="analytics">Analytics</ConsentBannerCategory>
        <ConsentBannerSave>Save preferences</ConsentBannerSave>
      </ConsentBannerPreferences>
      <ConsentBannerActions>
        <ConsentBannerAccept>Accept</ConsentBannerAccept>
        <ConsentBannerReject>Reject</ConsentBannerReject>
        <ConsentBannerCustomize>Customize</ConsentBannerCustomize>
      </ConsentBannerActions>
    </ConsentBanner>
  ) : (
    <ConsentToggle consent={consent} toggledCategories={["analytics"]} />
  );
}
```

The root gates itself on `consent.isPromptNeeded`; pass `open` to override — e.g. reopening
the banner as a "Cookie settings" panel after a decision (GDPR expects withdrawing
consent to be as easy as giving it).

The stored decision is the single source of truth (`useSyncExternalStore` under the
hood): hydration-safe on prerendered pages, and a decision made in one tab dismisses the
banner in every other tab via the `storage` event.

For Consent Mode v2, `setGoogleConsentDefault(decision, { waitForUpdateMs, region })`
issues the pre-tag default (it defines the gtag queueing stub itself), and
`setGoogleAdsDataRedaction`/`setGoogleUrlPassthrough` cover the denied-ads flags. A GPC
signal is honored as a do-not-sell-or-share opt-out: it forces `ads` denied without
withdrawing first-party `analytics`.

## TanStack Start wiring

`apps/ui` (`src/features/tracking/`) is the reference consumer. ISR HTML is CDN-cached and
shared across visitors, so it cannot be personalized per visitor — the shipped lane is a
**server function** that resolves region after hydration. The
**`@codefast/tracking/tanstack-start`** subpath (optional peer on
`@tanstack/react-start`, server-only) owns the request/response glue, so the app's server
functions are one-liners:

1. **Server function** — `resolveInitialConsentFromRequest({ requestedCategories })`
   reads the geo header (default `x-vercel-ip-country`) and `sec-gpc`, stamps
   `cache-control: private, no-store`, and fails closed when geo is missing. Anonymous-id
   persistence: `setAnonymousIdResponseCookie` / `clearAnonymousIdResponseCookie` around
   `createServerFn` handlers (see `apps/ui` `anonymous-id.ts`). Static top-level imports
   are fine in server-fn files — the Start compiler strips handler bodies (and their
   then-unused imports) from the client transform; see the isolation section below for
   the build-time guard.
2. **Client store** — `createInitialConsentStore({ resolve, sessionStorageKey? })`
   (`@codefast/tracking/client`) owns the whole client half: strictest default until the
   server answers, single-flight resolve, per-session cache (validated with
   `isInitialConsent`), fail-closed-but-retryable errors, retry on tab-visible. Kick
   `store.ensureResolved()` at router creation (window-guarded) so the round trip overlaps
   hydration; read it via `useInitialConsent(store)` (`@codefast/tracking/react`) or
   `useSyncExternalStore` directly, and pass
   `getMode: () => store.getSnapshot().initialConsent.mode` into `createIsAnalyticsAllowed`.
3. **`createIsAnalyticsAllowed` / `createConsentWithdrawalHandler`**
   (`@codefast/tracking/client`) — tracker gate + revoke clears (`tracker.clear`,
   anonymous-id cookie, `_ga*` via `clearGoogleAnalyticsCookies`).
4. **`useGoogleConsentSync`** (`@codefast/tracking/react`) — Consent Mode `update` +
   optional idempotent gtag load, including cross-tab / privacy-page decisions.

ISR/CDN-cached HTML is shared across visitors — bake the strictest Consent Mode default
(`STRICTEST_INITIAL_CONSENT` from the root/`core` entry) into that shared render via a
literal `defaultConsent`. Do not put geo (or any request-derived consent) into it via
`loaderData` or the document shell; per-visitor region rides the private server-fn lane
after hydration.

## Server-side delivery

`createServerTracker` accepts `waitUntil` — hand it Cloudflare's `ctx.waitUntil`,
Vercel's `waitUntil`, or srvx's `request.waitUntil` and `track`/`group`/`alias` resolve
after validation instead of after the slowest destination's retry ladder; failures still
report through `onDestinationError`. `withContext(context)` binds the per-request identity
once (pairs with `resolveServerTrackerContextFromRequest` from the `tanstack-start`
subpath), so handlers read `tracker.withContext(ctx).track(name, props)`. The fetch-based
destinations (`createHttpDestination`, `createGa4MeasurementProtocolDestination`) abort
stalled requests after `requestTimeoutMs` (default 10s), and the HTTP destination ships a
whole queue flush as one batched POST via `sendBatch`.

### Beacon ingest (the receive half)

`relayTrackedEvents(payload, { catalog, destinations, context?, isAllowed? })`
(`@codefast/tracking/server`) validates a batch of client envelopes (shape, catalog
membership, schema), re-stamps identity from what the server read off the request, keeps
client-minted `eventId`s so re-sent beacons dedupe, and fans out with the server retry
ladder. `createTrackedEventIngestHandler(options)` wraps it as a framework-agnostic
`Request → Response` endpoint (405/400/413 handling included) for
`flushWithBeacon`/`beaconEndpoint` to target.

### Consent on the server

`withConsentCookieMirror(storage, { cookieName })` (`@codefast/tracking/client`) mirrors
every saved decision into a cookie (localStorage stays the UI's source of truth);
`readConsentDecisionCookie` (`@codefast/tracking/server`) or
`readConsentDecisionRequestCookie` (`tanstack-start`) reads it back under the current
policy version — the gate that keeps server-owned tracking honoring exactly what the
visitor chose, instead of tracking consent-blind.

### Keeping server-only subpaths out of client bundles

`./server`, `./server/*`, `./tanstack-start`, and
`./destinations/ga4-measurement-protocol` (it carries an `apiSecret`) must never enter a
client bundle. On TanStack Start, enforce that at build time with the plugin's
import-protection — the default rules already deny local `**/*.server.*` files in the
client environment; add the package lanes as client-denied specifiers:

```ts
tanstackStart({
  importProtection: {
    client: {
      specifiers: [
        "@codefast/tracking/server",
        "@codefast/tracking/server/**",
        "@codefast/tracking/tanstack-start",
        "@codefast/tracking/destinations/ga4-measurement-protocol",
      ],
    },
  },
});
```

A violation is mocked with a console diagnostic in dev and fails the build in prod, with
a trace of the offending import chain. On other bundlers, wire the equivalent deny-list
(or an eslint/oxlint import restriction) — the package deliberately ships no runtime
guard, since `package.json#exports` here is generated by tooling that owns the condition
map.

## Google tag / GTM loaders (advanced Consent Mode)

Prefer the pre-hydration bootstrap (not a post-hydration mount) so Consent Mode's default
lands before any Google hit. Bootstraps use **advanced** Consent Mode: set the v2
`default` from the stored decision (or region fallback), then **always** load gtag.js /
gtm.js — even when storage is denied — so cookieless pings and consent modeling can run.
This does **not** weaken the package's first-party consent gate (`isAnalyticsAllowed`,
identifier minting, non-exempt destinations); only Google's tag script loading changes.

```tsx
import { loadGtagScript } from "@codefast/tracking/destinations";
import { GtagConsentBootstrap } from "@codefast/tracking/react";

// In <head> / shell — bake the strictest default on cached HTML; the server-fn lane
// corrects the consent UI + gtag update after hydration (see apps/ui).
// Same nonce on this host script and on loadGtagScript for CSP.
<GtagConsentBootstrap
  consentStorageKey="tracking-consent"
  dataLayerName="dataLayer" // optional; custom names also set gtag.js's `l` param
  debugMode={import.meta.env.DEV} // optional — gtag('config', id, { debug_mode: true })
  defaultConsent={{ ads: false, analytics: false }}
  gaMeasurementId="G-XXXXXXX"
  nonce={cspNonce} // optional — stamped on the injected gtag.js tag too
  policyVersion="2026-01"
/>;
```

GTM variant: `buildGtmConsentBootstrapScript` / `loadGtmScript` /
`createGoogleTagManagerDestination`. If GTM already loads GA4, do **not** also register
`createGoogleAnalyticsDestination` or events will double-fire.

SPA page views: leave `trackPageViews` off (default) and rely on GA4 Enhanced Measurement
/ GTM history tags — enabling both double-counts.
