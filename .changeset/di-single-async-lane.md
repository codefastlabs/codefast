---
"@codefast/di": patch
---

Collapse the async transient-dynamic resolver into a single lane and retune the cycle-set threshold.

The async lane used to split at depth 32 into a fast path (linear path scan, shared context, no stack frames) and a slow path (forced Set, fresh context per level, stack frames, extra microtask hop) — so context identity, `ctx.graph` contents, and promise shape all changed silently at that depth. Both are now one lane whose cycle guard goes through `enterResolutionPath`, the only mechanism that stays correct when chains interleave (`Promise.all`) and which adapts on its own: a linear scan while the path is short, an attached Set past `RESOLUTION_SET_THRESHOLD`. `DEEP_LANE_THRESHOLD` is gone from the package entirely.

`RESOLUTION_SET_THRESHOLD` drops from 128 to 32 on fresh measurements — at 128 an async chain costs 1275 / 3641 / 9645 / 26082 ns at depth 16 / 32 / 64 / 128 versus 1202 / 3285 / 7735 / 16837 at 32, so the old value was the worse choice at every depth measured.
