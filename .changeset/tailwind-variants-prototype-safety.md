---
"@codefast/tailwind-variants": patch
---

A variant value naming an `Object.prototype` member no longer reaches it. A compiled variant group is indexed by
whatever a caller passes, and it was a plain object — so `group["toString"]` answered with a function instead of
`undefined`. The flat lane concatenated that function's source text into the class string, and the slot lane read slot
positions off `Object.prototype` and threw:

```
tv({ base: "block", variants: { size: { sm: "p-2" } } })({ size: "toString" })
  →  "block function toString() { [native code] }"

tv({ slots: { base: "rounded" }, … })({ size: "__proto__" }).base()
  →  TypeError: Cannot read properties of undefined (reading 'length')
```

Groups and the slot index map are now compiled onto prototype-less objects, which closes both resolvers and the
selection encoder at once since all three read the same object. It costs roughly twice what reusing the source object
did, once per component definition.

Two smaller things fall out of the same reading. A value the group does not answer is no longer memoised into the id
table, which a long-lived server rendering user-supplied values would otherwise grow without bound; and inherited keys
no longer consume the ids a group's declared values need, which used to disable a resolver's cache permanently after a
few junk values.
