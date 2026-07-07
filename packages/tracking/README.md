# @codefast/tracking

Fullstack, type-safe event tracking for TanStack Start apps. Each app defines its own Zod
event catalog tagged with an owner (`"client"` or `"server"`); trackers built from that
catalog only allow firing events owned by that side — enforced at compile time.

See [SPEC.md](./SPEC.md) for the full design (identity correlation, offline queue/retry,
multi-destination fan-out, region-based consent).

## Status

Early scaffold. `core`, `client`, `server`, and `react` (headless consent) implement the
shapes described in the spec. `createVercelAnalyticsDestination`,
`createGoogleAnalyticsDestination`, and `createGa4MeasurementProtocolDestination` are
implemented; PostHog is not built yet — use `createHttpDestination` or implement the
`Destination` interface directly.

## Quick start

```ts
import { defineEventCatalog } from "@codefast/tracking";
import { createClientTracker, createLocalStorageQueueStorage } from "@codefast/tracking/client";
import { createHttpDestination } from "@codefast/tracking/destinations";
import { z } from "zod";

export const catalog = defineEventCatalog({
  button_clicked: { owner: "client", schema: z.object({ id: z.string() }) },
  order_completed: { owner: "server", schema: z.object({ orderId: z.string(), amount: z.number() }) },
});

const tracker = createClientTracker({
  anonymousId: crypto.randomUUID(),
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
`ConsentBanner`/`ConsentToggle` are headless — no `@codefast/ui` dependency. Style the
root via `className` and the inner parts via their `data-slot` attributes
(`consent-message`, `consent-actions`, `consent-action`, `consent-preferences`,
`consent-category`), e.g. Tailwind's `**:data-[slot=consent-action]:rounded-md`.

```tsx
import { createLocalStorageConsentStorage } from "@codefast/tracking/client";
import { updateGoogleConsent } from "@codefast/tracking/destinations";
import { ConsentBanner, ConsentToggle, useConsent } from "@codefast/tracking/react";

// Module scope — useConsent subscribes to the storage, so it must be a stable reference.
const consentStorage = createLocalStorageConsentStorage("tracking-consent");

function ConsentGate({ mode }: { mode: "opt-in" | "opt-out" }) {
  const consent = useConsent({
    categories: ["analytics"], // the purposes your prompt asks about — Accept grants exactly these
    mode,
    onDecision: (decision) => {
      updateGoogleConsent(decision); // per-category Consent Mode v2 update
      if (!decision.analytics) tracker.clear(); // stop tracking + drop the pending queue
    },
    policyVersion: "2026-01",
    storage: consentStorage,
  });

  return mode === "opt-in" ? (
    <ConsentBanner
      // optional second layer: per-category checkboxes ("Customize" → "Save preferences")
      categories={[{ category: "analytics", label: "Analytics" }]}
      consent={consent}
      message={
        <>
          We use cookies to understand how you use this site. <a href="/privacy">Privacy policy</a>
        </>
      }
    />
  ) : (
    <ConsentToggle consent={consent} />
  );
}
```

The stored decision is the single source of truth (`useSyncExternalStore` under the
hood): hydration-safe on prerendered pages, and a decision made in one tab dismisses the
banner in every other tab via the `storage` event.

For Consent Mode v2, `setGoogleConsentDefault(decision, { waitForUpdateMs, region })`
issues the pre-tag default (it defines the gtag queueing stub itself), and
`setGoogleAdsDataRedaction`/`setGoogleUrlPassthrough` cover the denied-ads flags. A GPC
signal is honored as a do-not-sell-or-share opt-out: it forces `ads` denied without
withdrawing first-party `analytics`.
