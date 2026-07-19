# @codefast/tracking

Consent-gated, type-safe event tracking for TanStack Start apps.

[![npm version](https://img.shields.io/npm/v/@codefast/tracking)](https://www.npmjs.com/package/@codefast/tracking)
[![license](https://img.shields.io/npm/l/@codefast/tracking)](https://github.com/codefastlabs/codefast/blob/main/LICENSE)

- **One catalog, typed end to end** — apps define their events over any
  [Standard Schema](https://standardschema.dev) library (zod, `zod/mini`, valibot, ...);
  `track()` validates properties at the call site and at runtime, and the client bundle
  only pays for the schema library the app already ships.
- **One consent config, every surface** — `ConsentConfig` is the single bag for the
  storage key, policy version, and requested purposes; the React hooks, the tracker gate,
  and the pre-hydration gtag bootstrap all take the same object, so nothing drifts.
- **ISR-safe by design** — shared/CDN-cached HTML bakes the strictest consent default;
  the region-correct default arrives per visitor over a private server-function lane.

## Status

Pre-1.0 (canary). The surface is deliberately small: it covers exactly what a consented
gtag + Vercel Analytics setup on TanStack Start needs, and nothing speculative. Lanes
that shipped here before (offline queue, beacon relay, server-side tracker, GTM,
Segment-style `identify`/`group`/`alias`/`page`) were removed because no consumer called
them — git history has them if a real need returns.

## Installation

```bash
pnpm add @codefast/tracking
```

Every peer is optional and only needed by the surface that uses it: `react`/`react-dom`
(>= 19) for `/react`, `@tanstack/react-start` (>= 1.168) for `/adapters/tanstack-start`, and
`@vercel/analytics` for the Vercel destination.

## Quick Start

```ts
// consent.ts — the one consent contract every surface shares
import { defineConsentConfig } from "@codefast/tracking";

export const consentConfig = defineConsentConfig({
  policyVersion: "2026-01", // bump to re-prompt everyone
  requestedCategories: ["analytics"],
  storageKey: "my-app-consent",
});
```

```ts
// consent-runtime.ts — live client instances derived from the config
import { createConsentRuntime } from "@codefast/tracking/client/consent-runtime";

import { consentConfig } from "./consent";
import { resolveVisitorConsent } from "./resolve-visitor-consent"; // server fn, see below

export const consentRuntime = createConsentRuntime({
  config: consentConfig,
  initialConsentSessionStorageKey: "my-app-initial-consent",
  resolveInitialConsent: () => resolveVisitorConsent(),
});
```

```ts
// tracking.ts — catalog + tracker
import { defineEventCatalog } from "@codefast/tracking";
import { createClientTracker } from "@codefast/tracking/client/create-client-tracker";
import { createGoogleAnalyticsDestination } from "@codefast/tracking/destinations/google-analytics";
import { createVercelAnalyticsDestination } from "@codefast/tracking/destinations/vercel-analytics";
import * as z from "zod/mini";

import { consentRuntime } from "./consent-runtime";

export const catalog = defineEventCatalog({
  copy_code: { schema: z.object({ name: z.string() }) },
});

export const tracker = createClientTracker({
  anonymousId: () => "...", // see the durable anonymous id section
  catalog,
  destinations: [
    // Vercel is cookieless and receives no identifier — it may keep counting pre-consent.
    createVercelAnalyticsDestination({ consentRequirement: "exempt" }),
    createGoogleAnalyticsDestination(),
  ],
  isAnalyticsAllowed: consentRuntime.isAnalyticsAllowed,
});

tracker.track("copy_code", { name: "button" }); // typed + runtime-validated
```

Destinations own their transport (gtag.js and Vercel both batch in-page), so `track()`
is fire-and-forget — a failing destination can never break the interaction.

## Event catalog

The package ships no events and no schema library — every app builds its own catalog
with `defineEventCatalog` over whatever Standard Schema validator it already uses.
`track()` infers both the event name and its properties from the catalog, then validates
the properties at runtime; a mismatch throws at the call site. Async schemas are rejected
by design — tracking sits on synchronous call paths.

## Subpaths

The root `@codefast/tracking` is the **client entry**: it re-exports the isomorphic core
(catalog types, `Destination`, consent model + config) plus the whole browser-side surface
(tracker, consent runtime, React bindings, and the client destinations). Server-only lanes
are their own subpaths and are never re-exported from the root:

- `@codefast/tracking` — client entry: core + `createClientTracker`, `createConsentRuntime`,
  the `useConsent`/`ConsentBanner`/`GtagConsentBootstrap` React bindings, the gtag +
  ad-network destinations.
- `@codefast/tracking/destinations/vercel-analytics` — its own subpath so its
  `@vercel/analytics` peer is only pulled in when used.
- `@codefast/tracking/server/*` — request-scoped, **server-only**: `server/initial-consent`,
  `server/consent-receipt-store`, `server/measurement-protocol`, … (server code imports the
  core it needs from `@codefast/tracking/core/*`, never from the client root).
- `@codefast/tracking/adapters/tanstack-start` — request/response glue over Start's server
  context, **server-only**.
- `@codefast/tracking/tooling/import-protection` — `SERVER_ONLY_SUBPATHS` deny-list for
  client bundles.
- `@codefast/tracking/css/consent.css` — optional plain-CSS theme for the consent banner.

Every built module is also its own subpath (e.g. `@codefast/tracking/client/gpc`) for
granular imports. Server-only lanes (`server/*`, `adapters/*`) must never enter a client
bundle — feed `SERVER_ONLY_SUBPATHS` to the framework's import-protection (see below). There
is deliberately no server-side tracker: destinations batch in-page, and the server half of
the package is consent resolution plus cookie persistence.

## Consent (region-based, per-category)

`ConsentDecision` is per-purpose (`{ ads, analytics }`), mirroring Google Consent Mode
v2. Region resolves the mode: GDPR (EU, plus UK/EEA-EFTA equivalents) and Vietnam's PDPL
get **opt-in**; the US (CCPA/CPRA) and unrecognized regions get **opt-out**, with GPC
honored as an ads-only opt-out. Stored records are policy-versioned and shape-checked —
a malformed or legacy-shaped record re-prompts instead of silently deciding.

- `useConsent({ config, mode, storage })` — `useSyncExternalStore` bridge over the stored
  decision; cross-tab saves sync through the `storage` event.
- `ConsentBanner` + parts (`Title`/`Description`/`Actions`/`Accept`/`Reject`/`Customize`/
  `Preferences`/`Category`/`Save`) — headless, `data-slot`-styleable; optional plain-CSS
  theme at `@codefast/tracking/css/consent.css`. `ConsentToggle` is the persistent
  opt-out control CCPA requires.
- `useGoogleConsentSync(consent, { loadGtagScript? })` — pushes Consent Mode `update`
  signals, including privacy-page and cross-tab decisions.
- `createConsentWithdrawalHandler({ clearAnonymousId?, clearGoogleAnalyticsCookies? })` —
  wire to `onDecision` so a denial clears first-party identifiers.

### The ISR lane

ISR/CDN-cached HTML is shared across visitors, so no render may read geo. Bake
`STRICTEST_INITIAL_CONSENT` into the shared render (and into `<GtagConsentBootstrap />`),
then resolve the region-correct default per visitor after hydration:

1. **Server function** — `resolveInitialConsentFromRequest({ requestedCategories })`
   (`@codefast/tracking/adapters/tanstack-start`) reads the geo header and `sec-gpc`, stamps
   `cache-control: private, no-store`, and fails closed when geo is missing.
2. **Client** — `createConsentRuntime` owns the rest: strictest default until the server
   answers, single-flight resolve, per-session cache, fail-closed-but-retryable errors.
   Kick `runtime.ensureInitialConsentResolved()` at router creation (window-guarded) so
   the round trip overlaps hydration; read it reactively via
   `useInitialConsent(runtime.initialConsentStore)` (`@codefast/tracking/react/use-initial-consent`).

## Durable anonymous id ("client mints, server persists")

`createServerPersistedAnonymousId` (`@codefast/tracking/client/server-persisted-anonymous-id`) mints a UUID cookie
lazily — only once an event is actually allowed to send — and asks the server to re-issue
it via `Set-Cookie`, which escapes Safari ITP's 7-day cap on script-written cookies. The
server half is one line per endpoint with `setAnonymousIdResponseCookie` /
`clearAnonymousIdResponseCookie` (`@codefast/tracking/adapters/tanstack-start`); both validate the
id is exactly UUID-shaped, so a public endpoint can never echo attacker input into a
response header.

## Google tag (advanced Consent Mode)

`<GtagConsentBootstrap config={consentConfig} defaultConsent={...} gaMeasurementId="G-…" />`
(`@codefast/tracking/react/use-initial-consent`) renders the pre-hydration inline script: Consent Mode v2
`default` first (stored decision wins over the baked fallback), then gtag.js always loads
so cookieless pings and consent modeling can run even when storage is denied. Page views
are gtag's own job (`config` + Enhanced Measurement) — the destination only forwards
catalog events. Runtime changes go through `useGoogleConsentSync`/`updateGoogleConsent`.

## Keeping server-only subpaths out of client bundles

`./server` and `./adapters/tanstack-start` must never enter a client bundle. On TanStack Start,
spread the package's own deny-list into the plugin's import-protection so it versions
with the package instead of going stale in your config:

```ts
import { SERVER_ONLY_SUBPATHS } from "@codefast/tracking/tooling/import-protection";

tanstackStart({
  importProtection: {
    client: { specifiers: [...SERVER_ONLY_SUBPATHS] },
  },
});
```

A violation is mocked with a console diagnostic in dev and fails the build in prod, with
a trace of the offending import chain.

## Reference consumer

[`apps/ui` (`src/features/tracking/`)](https://github.com/codefastlabs/codefast/tree/main/apps/ui/src/features/tracking)
in this repo wires everything above on a real ISR-deployed TanStack Start site — consent
config + runtime, banner + persistent toggle, gtag bootstrap, durable anonymous id, and
the private server-function consent lane.

## License

[MIT](https://github.com/codefastlabs/codefast/blob/main/LICENSE)
