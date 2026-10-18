---
"@codefast/di": patch
---

An `@inject` accessor now compiles into its class's instantiation plan, like a constructor parameter: the plan resolves
it before `new` and the accessor's `init` takes the value, instead of each accessor resolving again through the
container as the instance initializes. An accessor-injected class may now sit anywhere in a plan, not only at its root.
`@inject` returns an `init` rather than adding an initializer that writes through `context.access.set`, so the value is
the field's initial value. A standalone probe built with `tsc` puts one accessor at 46 ns → 31 ns per resolve and two at
59 ns → 41 ns; a paired run reads `accessor-injection-construct` +26%, with the canaries level. A custom
`MetadataReader`'s accessor records are not prepared, so such a class keeps resolving its accessors itself.
