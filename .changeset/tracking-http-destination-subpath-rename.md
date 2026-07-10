---
"@codefast/tracking": minor
---

Rename the `http-destination` module to `http`, matching the `create<X>Destination` file-naming convention used by every other destination. Breaking for deep imports only: `@codefast/tracking/destinations/http-destination` is now `@codefast/tracking/destinations/http`; imports from the `@codefast/tracking/destinations` barrel are unaffected.
