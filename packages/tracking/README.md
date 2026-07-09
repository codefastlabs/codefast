# @codefast/tracking

Fullstack, type-safe event tracking for TanStack Start apps. Each app defines its own Zod
event catalog tagged with an owner (`"client"` or `"server"`); trackers built from that
catalog only allow firing events owned by that side — enforced at compile time.

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

## Router page views + unload flush

`attachRouterPageTracking` is duck-typed against `Router["subscribe"]`, so it takes a real
`@tanstack/react-router` instance without this package depending on it. `attachClientLifecycle`
wires the periodic flush and the `sendBeacon` unload flush — `EventQueue` itself already
auto-flushes once a batch hits its size threshold.

```ts
import { attachClientLifecycle, attachRouterPageTracking } from "@codefast/tracking/client";

attachRouterPageTracking(tracker, router); // router: your app's TanStack Router instance
attachClientLifecycle(tracker, { beaconEndpoint: "/api/events", flushIntervalMs: 10_000 });
```

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
`consent-preferences`, `consent-category`, `consent-toggle`), e.g. Tailwind's
`**:data-[slot=consent-action]:rounded-md`. `data-state` on the root flips between
`prompt` and `preferences`.

```tsx
import {
  createConsentWithdrawalHandler,
  createIsTrackingAllowed,
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
const categories = ["analytics"] as const;
const policyVersion = "2026-01";

// getMode re-reads each call — typically from window.__INITIAL_CONSENT__ after the bootstrap.
const isTrackingAllowed = createIsTrackingAllowed({
  categories,
  getMode: () => window.__INITIAL_CONSENT__?.mode ?? "opt-in",
  hasGlobalPrivacyControlSignal,
  policyVersion,
  storage: consentStorage,
});

const onDecision = createConsentWithdrawalHandler({
  clearAnonymousId: anonymousId.clear,
  clearGoogleAnalyticsCookies,
  clearTracker: () => tracker.clear(),
});

function ConsentGate({ mode }: { mode: "opt-in" | "opt-out" }) {
  const consent = useConsent({
    categories, // Accept grants exactly these — never unrequested purposes
    mode,
    onDecision,
    policyVersion,
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

`apps/ui` (`src/features/tracking/`) is the reference consumer. The package helpers below
cover the glue every Start app otherwise reimplements:

1. **`buildInitialConsent({ countryCode, categories, hasGlobalPrivacyControlSignal? })`**
   (`@codefast/tracking/server`) — region → mode → default decision for SSR shells and
   edge-middleware cookie payloads. Export `EU_COUNTRY_CODES` /
   `OPT_IN_EQUIVALENT_COUNTRY_CODES` when middleware must duplicate the map (Vercel
   Routing Middleware cannot import this package).
2. **`buildInitialConsentBootstrapScript({ cookieName, fallback })`**
   (`@codefast/tracking/destinations`) — pre-hydration script that prefers the middleware
   cookie over a baked fallback into `window.__INITIAL_CONSENT__`.
3. **`createIsTrackingAllowed` / `createConsentWithdrawalHandler`**
   (`@codefast/tracking/client`) — tracker gate + revoke clears (`tracker.clear`,
   anonymous-id cookie, `_ga*` via `clearGoogleAnalyticsCookies`).
4. **`useGoogleConsentSync`** (`@codefast/tracking/react`) — Consent Mode `update` +
   optional idempotent gtag load, including cross-tab / privacy-page decisions.

TanStack Start's `shellComponent` renders before root loaders resolve — read geo headers
inside the SSR'd shell (or via `createIsomorphicFn`), not from root `loaderData`.

## Google tag / GTM loaders (advanced Consent Mode)

Prefer the pre-hydration bootstrap (not a post-hydration mount) so Consent Mode's default
lands before any Google hit. Bootstraps use **advanced** Consent Mode: set the v2
`default` from the stored decision (or region fallback), then **always** load gtag.js /
gtm.js — even when storage is denied — so cookieless pings and consent modeling can run.
This does **not** weaken the package's first-party consent gate (`isTrackingAllowed`,
identifier minting, non-exempt destinations); only Google's tag script loading changes.

```tsx
import {
  buildInitialConsentBootstrapScript,
  loadGtagScript,
} from "@codefast/tracking/destinations";
import { GtagConsentBootstrap } from "@codefast/tracking/react";

// Prefer middleware cookie over the SSR/prerender fallback.
<script
  dangerouslySetInnerHTML={{
    __html: buildInitialConsentBootstrapScript({
      cookieName: "app-initial-consent",
      fallback: initialConsent,
    }),
  }}
/>

// In <head> / shell — same nonce on this host script and on loadGtagScript for CSP.
<GtagConsentBootstrap
  consentStorageKey="tracking-consent"
  dataLayerName="dataLayer" // optional; custom names also set gtag.js's `l` param
  debugMode={import.meta.env.DEV} // optional — gtag('config', id, { debug_mode: true })
  defaultConsentExpression="window.__INITIAL_CONSENT__.defaultConsent"
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
