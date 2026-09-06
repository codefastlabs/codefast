---
"@codefast/tailwind-variants": minor
---

`tv()` no longer compiles at definition. The first call resolves straight from the configuration through a cold lane
that answers exactly what the compiled plan answers, and the second call compiles the plan, so defining a component and
rendering it once both cost less than upstream while every render after keeps its speed. Two visible consequences:
`config` is a plain property rather than a defined read-only one, and a slot component returns the same slot object for
a repeated selection from the second call on.

The second call is cheaper too: a flat-lane variant group whose values are all strings is read in place rather than
copied onto a prototype-less object, behind the type check the flat lane already makes. Resolvers expose `variantKeys`,
the variant names in declaration order, as upstream does.

For editors, `VariantProps` is now read off the resolver's call signature instead of re-derived from its schema, which
makes it far cheaper for the checker on large configurations, and every configuration field and option carries a doc
comment that shows on hover.
