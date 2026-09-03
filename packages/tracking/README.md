# @codefast/tracking

Consent-gated, type-safe event tracking for TanStack Start apps that ship to a CDN-cached (ISR) deployment.

[![npm version](https://img.shields.io/npm/v/@codefast/tracking)](https://www.npmjs.com/package/@codefast/tracking)
[![license](https://img.shields.io/npm/l/@codefast/tracking)](./LICENSE)

- **One catalog, typed end to end** — the app defines its events over any [Standard Schema](https://standardschema.dev)
  library (zod, `zod/mini`, valibot, ...). `track()` infers the event name and its properties from the catalog and
  validates them at runtime, and the client bundle only pays for the schema library the app already ships.
- **One consent config, every surface** — `ConsentConfig` holds the storage key, the policy version, and the requested
  purposes. The React hooks, the tracker gate, and the pre-hydration Google tag bootstrap all take the same object, so
  nothing drifts.
- **ISR-safe by design** — shared HTML bakes the strictest consent default; the region-correct default arrives per
  visitor over a private server-function lane.
- **Per-category decisions** — consent is `{ ads, analytics }`, mirroring Google Consent Mode v2, with region-resolved
  opt-in or opt-out modes and Global Privacy Control honored as an ads opt-out.
- **Destinations own their transport** — gtag.js and Vercel Analytics batch in-page, so `track()` is fire-and-forget and
  a failing destination never breaks the interaction.

## Installation

```bash
pnpm add @codefast/tracking
```

Requires Node >= 24. The one runtime dependency is `@standard-schema/spec`. Every peer is optional and is only needed by
the surface that uses it: `react` and `react-dom` (>= 19) for the `react/*` subpaths, `@tanstack/react-start` (>= 1.168)
for `adapters/tanstack-start`, and `@vercel/analytics` for `destinations/vercel-analytics`.

Published on 0.x and versioned on its own track: breaking changes ship as minor versions, so pin the minor if you need
stability.

## Quick start

Three modules: the consent contract, the live consent runtime derived from it, and the catalog plus tracker.

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
import { resolveVisitorConsent } from "./resolve-visitor-consent"; // server function, see "The ISR lane"

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
  anonymousId: () => "...", // see "Durable anonymous id"
  catalog,
  destinations: [
    // Vercel is cookieless and receives no identifier, so it may keep counting before consent.
    createVercelAnalyticsDestination({ consentRequirement: "exempt" }),
    createGoogleAnalyticsDestination(),
  ],
  isAnalyticsAllowed: consentRuntime.isAnalyticsAllowed,
});

tracker.track("copy_code", { name: "button" }); // typed + runtime-validated
```

`anonymousId` is a callback, not a value: the tracker calls it per allowed event, so the id is only minted once an event
is actually permitted to send. `isAnalyticsAllowed` is consulted before every event; while it returns `false`, only
`consentRequirement: "exempt"` destinations still receive events, stripped of identifiers. Pass `isExemptionAllowed` to
gate even that lane per region, and `onDeliveryError` to meter a destination that throws or rejects.

## Event catalog

The package ships no events and no schema library. Every app builds its own catalog with `defineEventCatalog` over the
Standard Schema validator it already uses. `track()` infers both the event name and its properties from the catalog,
then validates the properties at runtime and hands destinations the parsed output (unknown keys stripped, transforms
applied). A validation failure throws at the call site. Schemas that validate asynchronously are rejected, because
tracking sits on synchronous call paths.

## Subpaths

The root `@codefast/tracking` is the **client entry**. It re-exports the isomorphic core (catalog types, `Destination`,
the consent model and `ConsentConfig`) plus the whole browser-side surface: `createClientTracker`,
`createConsentRuntime`, the `useConsent`/`ConsentBanner`/`GtagConsentBootstrap` React bindings, and the client-lane
destinations (Google Analytics, Meta, TikTok, Microsoft UET). Server-only lanes are never re-exported from the root.

| Subpath                                            | Lane        | Contents                                                                                             |
| -------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| `@codefast/tracking`                               | client      | Core + tracker + consent runtime + React bindings + gtag/ad-network destinations                     |
| `@codefast/tracking/destinations/vercel-analytics` | client      | Its own subpath so the `@vercel/analytics` peer is only pulled in when used                          |
| `@codefast/tracking/core/*`                        | isomorphic  | `consent`, `consent-config`, `consent-receipt`, `cookie`, `destination`, `event-catalog`, `event-id` |
| `@codefast/tracking/server/*`                      | server-only | `initial-consent`, `region`, `anonymous-id-cookie`, `consent-receipt`, `consent-receipt-store`, ...  |
| `@codefast/tracking/adapters/tanstack-start`       | server-only | Request/response glue over `@tanstack/react-start/server`                                            |
| `@codefast/tracking/tooling/import-protection`     | build       | `SERVER_ONLY_SUBPATHS`, the deny-list for client bundles                                             |
| `@codefast/tracking/css/consent.css`               | client      | Optional plain-CSS theme for the consent banner                                                      |

Every built module is also its own subpath (for example `@codefast/tracking/client/gpc`) for granular imports. Server
code imports the core it needs from `@codefast/tracking/core/*`, never from the client root. There is no server-side
tracker: destinations batch in-page, and the server half of the package is consent resolution plus cookie persistence.

## Consent

`ConsentDecision` is per purpose (`{ ads, analytics }`). The region resolves the mode: the EU (plus the UK, Iceland,
Liechtenstein, and Norway) and Vietnam are **opt-in**; the US and unrecognized countries are **opt-out**. Under opt-out,
a Global Privacy Control signal forces `ads` denied and leaves first-party analytics alone. Stored records carry a
`policyVersion`; a malformed record, or one saved under another version, counts as no decision and re-prompts.

```tsx
import { useConsent } from "@codefast/tracking/react/use-consent";
import { useInitialConsent } from "@codefast/tracking/react/use-initial-consent";

import { consentConfig } from "./consent";
import { consentRuntime } from "./consent-runtime";

export function useAppConsent() {
  // Strictest default until the server lane answers — see "The ISR lane".
  const { initialConsent, isResolved } = useInitialConsent(consentRuntime.initialConsentStore);
  const consent = useConsent({
    config: consentConfig,
    mode: initialConsent.mode,
    storage: consentRuntime.storage, // one shared instance — must be a stable reference
  });

  return { consent, isResolved };
}
```

- `useConsent({ config, mode, storage, hasGlobalPrivacyControlSignal?, onDecision? })` bridges the stored decision to
  React through `useSyncExternalStore`. It returns `decision`, `effectiveConsent`, `isAnalyticsAllowed`,
  `isPromptNeeded`, and the `grantAll`/`denyAll`/`saveDecision` actions. A decision saved in another tab syncs through
  the storage subscription.
- `ConsentBanner` is headless and composable: `ConsentBannerTitle`, `ConsentBannerDescription`, `ConsentBannerActions`,
  `ConsentBannerAccept`, `ConsentBannerReject`, `ConsentBannerCustomize`, `ConsentBannerPreferences`,
  `ConsentBannerCategory`, and `ConsentBannerSave`. The root takes `consent` (the `useConsent` result) and an optional
  `open` override, renders nothing unless `consent.isPromptNeeded`, and flips `data-state` between `prompt` and
  `preferences`. Style the `data-slot` attributes yourself or import `@codefast/tracking/css/consent.css`.
- `ConsentToggle` is the always-visible control opt-out regions need. By default it flips only `ads`; pass
  `toggledCategories={["analytics"]}` (or both) for a broader opt-out.
- `createConsentWithdrawalHandler({ clearAnonymousId?, clearGoogleAnalyticsCookies? })` returns an `onDecision` handler
  that clears first-party identifiers when analytics is denied.

## The ISR lane

CDN-cached HTML is shared across visitors, so no render may read geo. Bake `STRICTEST_INITIAL_CONSENT` into the shared
render (and into `GtagConsentBootstrap`), then resolve the region-correct default per visitor after hydration.

```ts
// initial-consent-from-request.server.ts — server-only module
import { resolveInitialConsentFromRequest } from "@codefast/tracking/adapters/tanstack-start";

import { consentConfig } from "./consent";

export function initialConsentFromRequest() {
  return resolveInitialConsentFromRequest({ requestedCategories: consentConfig.requestedCategories });
}
```

```ts
// resolve-visitor-consent.ts — the server function the client calls
import { createServerFn } from "@tanstack/react-start";

import { initialConsentFromRequest } from "./initial-consent-from-request.server";

export const resolveVisitorConsent = createServerFn({ method: "GET" }).handler(() => initialConsentFromRequest());
```

`resolveInitialConsentFromRequest` reads the country header (`x-vercel-ip-country` by default; override with
`countryHeaderName`) and `sec-gpc`, stamps `cache-control: private, no-store`, and fails closed to the strictest default
when the header is missing — an unknown visitor is never treated as a known non-EU visitor.

`createConsentRuntime` owns the client half: the strictest default until the server answers, a single in-flight request,
a per-session cache under `initialConsentSessionStorageKey`, and a fail-closed but retryable error path. Call
`consentRuntime.ensureInitialConsentResolved()` at router creation (window-guarded) so the round trip overlaps
hydration, then read the result reactively with `useInitialConsent(consentRuntime.initialConsentStore)`, as in the
Consent section: `initialConsent.mode` feeds `useConsent`, and `isResolved` gates region-dependent UI so an opt-in
banner never flashes at an opt-out visitor. The hook also kicks resolution on mount, so the early call is an
optimization, not a requirement.

## Durable anonymous id

The client mints, the server persists. `createServerPersistedAnonymousId` mints a UUID cookie lazily — only once an
event is allowed to send — and asks the server to re-issue it via `Set-Cookie`, which is what lets the id outlive the
cap browsers put on script-written cookies. The server half is one line per endpoint.

```ts
// anonymous-id.ts
import {
  clearAnonymousIdResponseCookie,
  setAnonymousIdResponseCookie,
} from "@codefast/tracking/adapters/tanstack-start";
import { createServerFn } from "@tanstack/react-start";

export const ANONYMOUS_ID_COOKIE_NAME = "my-app-anon-id";

export const persistAnonymousIdCookie = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(({ data }) => {
    setAnonymousIdResponseCookie({ cookieName: ANONYMOUS_ID_COOKIE_NAME, id: data.id });
  });

export const clearAnonymousIdCookie = createServerFn({ method: "POST" }).handler(() => {
  clearAnonymousIdResponseCookie(ANONYMOUS_ID_COOKIE_NAME);
});
```

```ts
import { createServerPersistedAnonymousId } from "@codefast/tracking/client/server-persisted-anonymous-id";

import { ANONYMOUS_ID_COOKIE_NAME, clearAnonymousIdCookie, persistAnonymousIdCookie } from "./anonymous-id";

export const anonymousId = createServerPersistedAnonymousId({
  clearOnServer: () => clearAnonymousIdCookie(),
  cookieName: ANONYMOUS_ID_COOKIE_NAME,
  persist: (id) => persistAnonymousIdCookie({ data: { id } }),
});

// createClientTracker({ anonymousId: anonymousId.getOrCreate, ... })
```

`setAnonymousIdResponseCookie` throws unless the id is exactly UUID-shaped, so a public server function can never echo
attacker input into a response header. Wire `anonymousId.clear` into `createConsentWithdrawalHandler` so a withdrawal
expires the cookie on both sides.

## Google tag

`GtagConsentBootstrap` renders the pre-hydration inline script for advanced Consent Mode: it applies the Consent Mode v2
`default` signal (a stored decision wins over the baked `defaultConsent`), then always loads gtag.js so cookieless pings
and consent modeling can run even when storage is denied.

```tsx
import { STRICTEST_INITIAL_CONSENT } from "@codefast/tracking";
import { GtagConsentBootstrap } from "@codefast/tracking/react/gtag-consent-bootstrap";

import { consentConfig } from "./consent";

export function GoogleTag() {
  return (
    <GtagConsentBootstrap
      config={consentConfig}
      defaultConsent={STRICTEST_INITIAL_CONSENT.defaultConsent}
      gaMeasurementId="G-XXXXXXX"
    />
  );
}
```

Optional props: `dataLayerName`, `debugMode`, and a CSP `nonce` that is stamped on both the host script and the injected
gtag.js tag. Page views are gtag's own job (`config` plus Enhanced Measurement); `createGoogleAnalyticsDestination` only
forwards catalog events. Runtime decision changes go through `useGoogleConsentSync(consent, { loadGtagScript? })`, which
emits `update` whenever a stored decision exists (including cross-tab saves), or through `updateGoogleConsent` directly.

## Keeping server-only subpaths out of client bundles

`server/*` and `adapters/*` must never enter a client bundle. `SERVER_ONLY_SUBPATHS` is the package's own deny-list as
picomatch patterns; spread it into TanStack Start's import protection so the list versions with the package instead of
going stale in your config.

```ts
import { SERVER_ONLY_SUBPATHS } from "@codefast/tracking/tooling/import-protection";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

tanstackStart({
  importProtection: {
    client: { specifiers: [...SERVER_ONLY_SUBPATHS] },
  },
});
```

## Reference consumer

[`apps/ui/src/features/tracking`](../../apps/ui/src/features/tracking/) wires everything above on a real ISR-deployed
TanStack Start site: the consent config and runtime, the banner and the persistent toggle, the gtag bootstrap, the
durable anonymous id, and the private server-function consent lane.

## Documentation

- [codefastlabs.com/docs/tracking](https://codefastlabs.com/docs/tracking) — the rendered docs.
- [`SPEC.md`](./SPEC.md) — index of the behavioural contract; the language-neutral documents live under
  [`spec/`](./spec/README.md), one per concern (event model, consent, identity, tracker, destinations, server lane,
  security), each ending in conformance vectors.
- [`CHANGELOG.md`](./CHANGELOG.md) — release notes per version.

## Contributing

See the repository [contributing guide](../../CONTRIBUTING.md) for the toolchain, test taxonomy, and release flow.

## License

Released under the [MIT License](./LICENSE).
