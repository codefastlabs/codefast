---
"@codefast/di": patch
---

Remove a type parameter the resolver could never honour. Fifteen private methods took `Binding<Value>`
and returned `Value`, but every caller supplied `Value` through an unchecked `as Binding<Value>` — so the
generic documented an intent the compiler never verified. The internal lanes now take the erased
`Binding` and return `unknown`, and the eight public resolve entry points each cast once, where the
caller's token is the claim being made. Seventeen casts fewer in the resolver.

What made that possible: the binding kinds declare their lifecycle hooks as methods rather than
function-typed properties, so their parameters compare bivariantly and `Binding<Value>` stays assignable
to `Binding`. The public `ActivationHandler` and `DeactivationHandler` are unchanged and still checked
strictly, so a handler you write is verified exactly as before.

No behaviour change: the emitted JavaScript is identical apart from one line break.
