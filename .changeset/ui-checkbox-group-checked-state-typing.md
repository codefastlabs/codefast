---
"@codefast/ui": patch
---

Annotate `CheckboxGroupItem`'s `onCheckedChange` callback with a `CheckedState` type derived from the underlying Radix primitive. Radix's `radix-ui` umbrella namespace merge dropped the contextual type for the inline callback parameter, tripping `noImplicitAny` during the build; deriving the type from `Root` keeps it in lockstep with the primitive.
