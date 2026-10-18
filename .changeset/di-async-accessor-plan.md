---
"@codefast/di": patch
---

An `@inject`-accessor class now compiles into an async plan too, so `resolveAsync` stops interpreting it on every call.
The plan keeps the interpreted async lane's order: the constructor params settle first, then the accessors resolve on
the sync lane and the class constructs. A standalone probe puts `resolveAsync` of a one-accessor class at 120 ns → 78
ns, against 66 ns for the same class taking its dependency as a constructor param.
