---
"@codefast/theme": minor
---

`@codefast/theme` no longer depends on zod, so `AppearanceProvider`, `AppearanceScript` and `appearances` stop pulling
it into the bundle. `appearanceSchema` is removed: check a value with the new `isAppearance` type guard, or build a
schema from `appearances` in your own validator (`z.enum(appearances)` with zod).
