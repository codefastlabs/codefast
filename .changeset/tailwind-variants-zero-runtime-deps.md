---
"@codefast/tailwind-variants": minor
"@codefast/ui": patch
---

`@codefast/tailwind-variants` now ships with no runtime dependencies of its own, matching what `tailwind-variants` has always done. Two changes get it there.

`clsx` is gone, replaced by a flattener inside the package. It is deliberately identical, corners included: a `bigint` contributes nothing despite being a `ClassValue`, and an object's keys are read with `for…in`, so an inherited enumerable one counts. Verified by running the behaviour sweep — every configuration, every variant value, every slot, with and without merging — against `main` and diffing: **zero difference across 118,505 outcomes**. The dependency was only ever reached at compile time anyway, since resolution stopped calling it when the plan was introduced.

`ClassValue` is now declared here rather than re-exported from clsx, so the type survives the dependency leaving. Its shape is unchanged except that `ClassDictionary` is `Record<string, unknown>` rather than clsx's `Record<string, any>` — which means passing a **function** where a class value is expected is now a type error. It contributed nothing at runtime either way.

`tailwind-merge` moves from a dependency to a **peer** (`>=3.0.0`). A consumer who pins their own version now gets one copy at the version they chose, instead of a second one arriving underneath this package. Install it alongside — `@codefast/ui` already does on your behalf.
