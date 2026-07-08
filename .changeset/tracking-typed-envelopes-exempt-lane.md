---
"@codefast/tracking": minor
---

Discriminate event envelopes by `type` and add a consent-exempt destination lane.

`TrackedEvent` is now a union discriminated on `type: "track" | "page" | "identify" | "group" | "alias"` (Segment-style) instead of encoding built-ins into `$`-prefixed magic names — destinations translate each kind into their own vocabulary via an exhaustive `switch` (`identify` carries `traits`, `group` carries `groupId`/`traits`, `alias` carries `previousId`), and the app-chosen `name` only exists on `track`/`page`. This changes the wire format seen by HTTP destinations and the queue storage; stale queue records without a `type` are dropped silently. `Destination` gains `consent?: "exempt" | "required"` — while the tracker's consent gate is closed, exempt immediate destinations keep receiving `track`/`page` events stripped of `anonymousId`/`userId` (identity kinds and queueing stay fully gated), so cookieless sinks like Vercel Analytics can keep counting interactions without consent-gated identifiers. The Vercel destination accepts the flag via its options and still defaults to `"required"`.
