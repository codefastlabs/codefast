# @codefast/tracking

Fullstack, type-safe event tracking for TanStack Start apps. Each app defines its own Zod
event catalog tagged with an owner (`"client"` or `"server"`); trackers built from that
catalog only allow firing events owned by that side — enforced at compile time.

See [SPEC.md](./SPEC.md) for the full design (identity correlation, offline queue/retry,
multi-destination fan-out, region-based consent).

## Status

Early scaffold. `core`, `client`, `server`, and `react` (headless consent) implement the
shapes described in the spec. Vendor-specific destinations (PostHog, GA4) are not built
yet — use `createHttpDestination` or implement the `Destination` interface directly.

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

## Consent (region-based)

Resolve the region/mode server-side (`resolveRegion` + `resolveConsentMode` from
`@codefast/tracking/server` and `@codefast/tracking`) and pass `mode` down to the client.
`ConsentBanner`/`ConsentToggle` are headless — no `@codefast/ui` dependency, style them
with your own `className`.

```tsx
import { createLocalStorageConsentStorage } from "@codefast/tracking/client";
import { ConsentBanner, ConsentToggle, useConsent } from "@codefast/tracking/react";

function ConsentGate({ mode }: { mode: "opt-in" | "opt-out" }) {
  const consent = useConsent({
    mode,
    onDecision: (decision) => {
      if (decision === "denied") tracker.clear(); // stop tracking + drop the pending queue
    },
    policyVersion: "2026-01",
    storage: createLocalStorageConsentStorage("tracking-consent"),
  });

  return mode === "opt-in" ? <ConsentBanner consent={consent} /> : <ConsentToggle consent={consent} />;
}
```
