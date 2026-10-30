---
"@codefast/tailwind-variants": minor
---

**Breaking:** `extend` now merges a configuration the way upstream `tailwind-variants` does. A variant value, a slot or
a slot-map entry the child redeclares joins the parent's classes, parent first, instead of replacing them; a child's
`base` joins a parent's `slots.base`; a slot child over a flat parent puts its own base before the parent's; a child's
`compoundSlots` apply without redeclaring `slots`; and the child's variant names come first, in `variantKeys` and in the
order their classes are emitted.
