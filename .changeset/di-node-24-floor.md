---
"@codefast/di": minor
---

Lower the Node floor to 24, matching every other package in the monorepo. The container no longer calls the ES2025
`Map.prototype.getOrInsert` / `getOrInsertComputed`; both forms now live in `core/map-upsert` and are still chosen by
hit rate — eager where a bind is usually a token's first, computed where a lookup usually hits. A Node 24 serverless
runtime therefore needs no polyfill: `examples/tanstack-start` dropped the `Map.prototype` patch it carried to deploy on
`nodejs24.x`, along with the deferred import and the `await` that patch forced on every container boot.

Measured, not assumed. Paired alternating A/B against the previous build (source swap, isolate runner, four passes,
`benchmarks/di-inversify`) puts every scenario at parity or better beside a four-pass A/A floor on the same rows, with
`named-constant-get` clearing its floor at 1.14× — consistent with a small local helper inlining where a newly shipped
builtin does not. The table and the row that must not be cited are in the suite's `RESULTS.md`.

Also closes a latent typing hole the method form hid. TypeScript does not contextually type the right-hand side of
`??=`, so a bare `new Map()` there is `Map<any, any>` and every read through the field goes unchecked; every lazily
allocated index in the package now spells its type arguments. Both helpers additionally constrain their value type to
exclude `undefined`, since they read absence with one `get` — a map that stores `undefined` needs a `has` and is a
compile error here rather than a silent overwrite. `packages/di` also pins `lib` to `["ES2024", "ESNext.Decorators"]`,
so the Node floor is now a compile error to break rather than a note in CONTRIBUTING.
