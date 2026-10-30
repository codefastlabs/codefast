---
"@codefast/tailwind-variants": minor
---

**Breaking:** `tv`'s types now describe what it returns for every configuration, not only for a fresh object literal.

- A configuration held in a variable selects the same overload as the literal would: one with `slots` yields slot
  resolvers rather than a string, and one with `extend` keeps the variants it inherits.
- A resolver without variants takes no variant props, slots or not, so `card({ bogus: "x" })` and
  `createTV().tv({ base: "flex" })({ bogus: "x" })` no longer compile, `keyof VariantProps` of a slot-only resolver is
  `never`, and extending it keeps the extension's literal values. Extending a resolver without slots and adding `slots`
  yields slot resolvers.
- A call without slots, and every slot resolver, is typed `string`.
- `VariantResolver<Variants, Slots>` now selects between two exported shapes, `FlatVariantResolver` and
  `SlottedVariantResolver`, and its `Slots` defaults to none, so a resolver of one kind is no longer assignable to the
  other. Its `config` is `readonly`.
- `TailwindVariantsFactory` is `typeof tv`, so `createTV().tv` carries exactly `tv`'s overloads.
- A slot map in a compound variant's `class`/`className`, or in an extension's `variants`, must name a declared slot.
- A compound slot's condition accepts an array of alternatives, as compound variants already did.
- Readonly class arrays (`as const`) are accepted wherever classes are.
