---
"@codefast/di": patch
---

Let a child container compile an instantiation plan for a transient class binding its parent owns. The plan compiler
refuses to decide until a runtime resolve has read the class's lifecycle metadata, but that discovery was recorded on
the owner's introspector while the compiler consulted the introspector of whichever resolver was doing the resolving.
Where those differ, the child's answer stayed unknown forever: it recompiled the plan on every single resolve and threw
the result away each time, falling back to the interpreted path. The resolving side now settles its own answer after
instantiating a class binding another container owns.

Measured against `benchmarks/di-inversify` (fast profile, isolated, best-of-3 per side): median 1.003×, geomean 1.005×
over 103 scenarios, with no reproducible regression on a path the change touches.
