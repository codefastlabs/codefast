---
"@codefast/di": patch
---

The documented TypeScript floor is now 5.4, the release the published declarations actually need (they use `NoInfer`).
The previous 5.9 rested on `Symbol.metadata` becoming stable there, but its typings are unchanged since 5.2;
`README.md`, `SPEC.md` and `DECISIONS.md` now state the measured floor and its real reason.
