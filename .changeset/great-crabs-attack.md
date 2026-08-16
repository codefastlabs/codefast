---
"@codefast/cli": minor
---

Enforce all-or-none `@param` coverage in `codefast audit comments`: a doc block naming any parameter must name every
parameter of that signature — a partial list reads as complete. The check parses the declaration's own parameter list,
skips destructured parameters it cannot match by name, and refuses to guess through wrapper calls like `useCallback`.
