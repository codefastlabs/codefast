---
"@codefast/di": patch
---

The chain-versioned lookup memo answers a repeated token from a method small enough for its hot callers to inline: the
hit is the whole of `defaultEntry`, and everything that fills the memo is the miss. An alias resolve, a parent-owned
resolve from a child and every other lookup that reaches the memo pays one inlined compare where it paid a call.
