---
"@codefast/di": patch
---

A generated plan is rendered as flat statements in dependency order rather than one nested expression, and the plan
compiler inlines a transient graph to any depth: the private depth limit that escaped the tail of a chain deeper than 32
levels into the interpreted path is gone, so a deep class chain resolves through one plan.
