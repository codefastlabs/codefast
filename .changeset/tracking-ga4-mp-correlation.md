---
"@codefast/tracking": minor
---

Correlate GA4 Measurement Protocol hits with gtag.js's own identifiers.

GA4 joins hits on gtag's client ID (the `_ga` cookie), not on an app-generated anonymous ID — MP events sent with our ID landed on a different GA4 user than the visitor's client-side hits. New `extractGa4ClientId`/`extractGa4SessionId` helpers read gtag's `_ga`/`_ga_<stream>` request cookies (both GS1 and GS2 formats) so the destination can echo them via the new `clientId`/`sessionId` options. Events now also carry `engagement_time_msec`, `session_id`, and `timestamp_micros` — without them GA4 accepts the hit but leaves it out of realtime and session-scoped reports, and retried events drift to receipt time. `$group` maps to `join_group`; `$alias` is dropped (GA4 merges identities via `user_id`).
