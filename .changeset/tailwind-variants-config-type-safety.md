---
"@codefast/tailwind-variants": minor
---

Authoring a configuration is now type-checked as strictly as calling one. Three typos used to compile and then do
nothing: a `defaultVariants` key naming no variant, a `compoundVariants` key naming no variant, and a variant class map
naming no slot. Each failed the same silent way — nothing read the stray key, the compound never matched, the slot map
was dropped — so a mistyped character removed a style with no error anywhere.

The root cause was one overload. `extend` was optional on `ExtendedVariantConfig`, which made the last overload a
catch-all: a configuration the earlier three correctly rejected still matched it, and `TBase` with nothing to infer from
widened to `VariantSchema`, whose key is `string` — so every mistyped name became legal again. `extend` is now required
there, which is what that overload was always for. Alongside it, `defaultVariants` and `compoundVariants` no longer act
as inference sites for the variant schema (`NoInfer`), so a stray key is rejected instead of quietly widening the schema
to include it.

Two smaller corrections fall out. `defaultVariants` is typed by the new `VariantValues<T>` rather than the call-site
`VariantSelection<T>`, so it no longer accepts a `className` a configuration has no use for. And in a slot configuration
a variant's object value is now held to the declared slots — `SlotClassValue<S>` — because resolution has always read an
object there as slot names rather than clsx conditions; `base` stays admissible whether or not it is declared, matching
the plan that synthesises it.

A configuration without slots keeps its clsx object values, and a compound condition naming an undeclared variant still
resolves at runtime for JavaScript callers and merged configurations — it is only the typed authoring path that now
rejects it, since no typed call could ever satisfy such a condition.

`tests/types/common/config-authoring.test.ts` holds all of this with `@ts-expect-error`, the first negative type tests
in the package. The 110 existing assertions only ever proved what compiles, which is exactly how three gaps survived.

**One configuration shape stops compiling.** Requiring `extend` closes the overload that used to accept anything, and
that overload was also what accepted a configuration whose literal types had widened — a hoisted
`const defaultVariants = { size: "sm" }`, a hoisted `compoundVariants` array, a spread of a shared partial. Those have
type `{ size: string }`, which was never assignable to `{ size?: "sm" }`; they compiled only because the catch-all
widened the schema to swallow them. Add `as const` to the hoisted value, or inline it.

The error TypeScript reports for this is `Property 'extend' is missing`, which names the last overload tried rather than
the real mismatch. It is the same message a plain variant typo now produces. Nothing in this repository hit either case,
but a consumer with a shared configuration fragment will.
