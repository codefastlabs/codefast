---
"@codefast/di": patch
---

pr: #965

The documented TypeScript floor is now 7, up from 5.9: TypeScript 7 is the one compiler that type-checks the package and
emits its published declarations, so it is the floor they support. `README.md`, `SPEC.md` and `DECISIONS.md` state it;
no code or declaration changed.
