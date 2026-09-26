---
"@codefast/di": patch
---

A binding unbound by its id stays unbound when the chain that displaced it is refined later. A scope change or an
`onActivation`/`onDeactivation` hook between the `unbind()` and a re-slot such as `whenNamed()` made the displacing
chain treat its parked copy of the unbound binding as current again, so the re-slot put that binding back in the
registry.
