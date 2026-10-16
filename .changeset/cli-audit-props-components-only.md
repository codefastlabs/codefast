---
"@codefast/cli": patch
---

`codefast audit props` reads an inline `&` parameter only on a component — a module-level function with a capitalised
name, declared as a function or held by a `const`, directly or through a call such as `memo(…)` — so a closure inside a
component, like `const targetFor = (event: Pick<…> & Partial<…>) => …`, and a lowercase helper are no longer reported.
