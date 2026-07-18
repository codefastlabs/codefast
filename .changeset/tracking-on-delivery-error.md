---
"@codefast/tracking": minor
---

`createClientTracker` now accepts an optional `onDeliveryError` hook, called once per failed delivery (a destination throwing synchronously or rejecting) with `{ destination, error, event }`. The tracker still swallows the failure so tracking never breaks the interaction — the hook is a metering seam for wiring delivery failures to a monitor in production. The hook is itself guarded, so a throwing observer can't break the interaction either. Exposes the `DeliveryErrorContext` type from `@codefast/tracking/client`.
