---
"@codefast/di": minor
---

Replace the `[string, unknown]` tag tuple with a `tag()` factory whose criteria are interned.

A tag key is declared once and mints its own criteria:

```ts
const Region = tag<"eu" | "us">("region");
container.bind(Storage).to(S3).whenTagged(Region.of("eu"));
container.resolve(Storage, { tag: Region.of("eu") });
```

The value type is now checked at both ends, so a bind site and a resolve site cannot drift apart — previously the key
was a bare string and the value was `unknown`, and a typo was a runtime `NoMatchingBindingError` rather than a compile
error. `whenTagged` takes the criterion instead of `(key, value)`, which makes it the same shape a request carries.

This is not a compatible change: `BindingTag` is an interned, branded object rather than a tuple, and nothing outside
`TagKey.of()` can construct one. `whenTagged`, `whenParentTagged`, `whenAnyAncestorTagged`, `whenParentTaggedAll`,
`whenAnyAncestorTaggedAll`, `ResolveOptions.tag/tags` and `InjectOptions.tag/tags` all take criteria now.

Interning is what pays for it, and it pays twice:

- **The registry indexes tagged bindings by the criterion**, not by key-then-value, which removes a hash level and —
  because equal criteria are one object — makes the index exact. The value re-check that existed only to correct a
  `Map`'s SameValueZero treatment of `±0` is gone; the intern cache splits those two under a private symbol instead, so
  `Object.is` (SPEC §3.5) still holds.
- **The multi-tag lane prefilters on a key mask.** Each key carries a bit, each slot and request the OR of theirs, so a
  slot whose keys the request does not cover is rejected by one AND and one compare before any criterion is read. Bits
  wrap every 32 keys; a shared bit is a false positive identity then rejects, never a false negative.

Measured with `di:bench:isolate` against the previous build, `@codefast/di` hz/op:

| Row                            | Before |        After |
| ------------------------------ | -----: | -----------: |
| `slot-tag-miss-optional`       |  13.3M | 19.8M (+48%) |
| `slot-tag-shorthand-hoisted`   |  38.9M | 49.8M (+28%) |
| `tagged-binding-resolve`       |  38.1M | 48.4M (+27%) |
| `multi-tag-slot-resolve`       |  10.9M | 13.8M (+27%) |
| `slot-tag-resolve-all`         |  38.2M | 46.5M (+22%) |
| `multi-tag-constraint-resolve` |   6.9M |  8.1M (+18%) |

Five control rows the change does not touch moved between −3.3% and +3.0%, and the head-to-head aggregate held at 44
wins / 0 parity / 0 losses against inversify 8.2.3. Three new `mask-*` rows price the prefilter directly: reject-heavy,
admit-then-decide, and the shared-bit collision.

One thing interning did **not** buy: an inline `Region.of(v)` is still slower than a hoisted criterion (+2–3% against
+25–28%), because `.of()` reads the intern map on every call. The gap between the inline and hoisted rows widened rather
than closed.
