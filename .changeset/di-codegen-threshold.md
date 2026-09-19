---
"@codefast/di": patch
---

A compiled plan is generated as a function of its own on its 1024th run rather than its 32nd. Measured from a fresh
container, generation costs about sixty closure runs, the generated function then runs at twice a closure run's cost for
about thirty runs while it warms up, and a warm generated run saves three to seven percent over a closure run — so the
change repays only after some thousand runs of one plan in one container. A per-request child no longer pays a
generation it never recoups; a long-lived container still generates its hot plans.
