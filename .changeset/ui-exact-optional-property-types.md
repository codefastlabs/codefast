---
"@codefast/ui": patch
---

Enable `exactOptionalPropertyTypes` for the package. Optional context-value and option types that a provider or hook may
populate with an explicit `undefined` are now typed `?: T | undefined`, and the external Radix/Sonner call sites that
forwarded a possibly-undefined prop now omit it when undefined instead of passing it through. Types only — no public API
or runtime change.
