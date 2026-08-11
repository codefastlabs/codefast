---
"@codefast/tailwind-variants": minor
---

A variant function now remembers what each selection resolved to, so a repeated selection skips both the plan walk and
`tailwind-merge`. Against the previous build the resolution rows measure 1.08× to 11.9×, and against `tailwind-variants`
the suite geomean moves from 6.18× to 19.8×. The motivating measurement: in the merged lane most of the cost was never
the merge algorithm — `tailwind-merge` caches — but building and hashing the joined class string to look that cache up,
which a key built from the selection avoids entirely.

The key is a mixed-radix number, one digit per variant. A variant no compound tests is keyed by its group key, since two
values sharing a key select the same classes; a variant a compound tests is keyed by the raw value, because a compound
compares against what the caller passed and `true` and `"true"` share a group key while comparing differently. A call
the key cannot represent — an axis past its capacity, a configuration too large to address in one safe integer, a
clsx-shaped `className` — resolves the long way as before.

Two consequences are worth knowing. A slot component called twice with the same selection gets back the **same** object
of slot functions: stable enough for a React dependency array, and shared, so nothing may mutate it. And the store is
bounded and keyed by the selection, so a component whose variant values are effectively unique per call fills it with
entries nothing reads again — the new `cacheResolutions: false` option turns it off for that component.

Alongside it: `extendTailwindMerge` is now memoised by `twMergeConfig` identity, so a design system handing one config
to a hundred components builds one merge function instead of a hundred, each with its own cache; a slot resolution keeps
only the props a compound can read rather than the caller's whole props object, which would otherwise pin `children` for
as long as the entry lives; and each slot's merged text is memoised, so re-reading a slot no longer re-runs the merge.

`tv` itself costs about a quarter of a microsecond more per component definition. The encoder is compiled on first
resolution rather than in `tv`, so a component that is defined and never rendered pays nothing for it.
