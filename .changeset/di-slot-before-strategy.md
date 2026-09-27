---
"@codefast/di": minor
---

**Breaking:** a binding's slot is declared before its strategy —
`bind(Logger).whenNamed("file").to(FileLogger).singleton()`. `when()`, `whenNamed()`, `whenTagged()`, `whenDefault()`
and `many()` now come before `to*()` and are refused after it with `ChainAlreadyRegisteredError`, so a binding registers
once, in its final slot, and no later step moves it, displaces something else or brings back what it displaced. Scope
and lifecycle hooks stay after `to*()`. To migrate, move each chain's slot steps in front of its `to*()` call.

The registry no longer parks the bindings a re-slot displaced or restores them, so a bind with a name or a tag costs a
quarter to two fifths less. `BindingBuilder`, `ConstantBindingBuilder` and `AliasBindingBuilder` lose their `Names` type
parameter, since the slot is settled before they exist.
