---
"@codefast/di": patch
---

Memoize the lookup cache's chain-summed registry version against a process-wide state epoch that every registry mutation
and activation-hook registration advances, and let a root container read both chain sums as its own version. A resolve
from a deep child no longer walks its whole ancestor chain on every lookup while nothing has changed; the first read
after any change re-sums exactly as before. The activation sum stays a walk: the memo that would serve it costs fields
on the resolver that the warm transient class lane pays for.
