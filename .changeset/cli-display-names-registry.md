---
"@codefast/cli": minor
---

`codefast audit display-names` also checks the names given to `Module.fromBindings(…)` and
`createAutoRegisterRegistry(…)` — both are modules, so their names follow the module rule, `<namespace>:<PascalName>`.
