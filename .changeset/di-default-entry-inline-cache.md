---
"@codefast/di": patch
---

Put a one-entry cache in front of `BindingLookupCache`'s options-less token map. Two shapes reach that map and neither can use the registry's direct index: an **alias**, whose terminal binding the index cannot name, and a token owned by a **parent container**, whose entry has to carry the owner. Both are then resolved in a loop over the same token, so the map lookup they repeat deserves an inline cache — the rule this package already applies to `LifecycleManager.activationHandlersFor()`.

Paired A/B against the previous build, seven passes alternating which side ran first, medians: `to-alias-redirect` **1.16×** (every pass 1.15–1.18) and `child-depth-2-resolve` **1.23×** (every pass 1.22–1.27), which were the two thinnest wins in the suite outside the lifecycle rows. `rebind-hot-swap` — the row that invalidates the cache on every iteration, so the only place a front cache could be pure overhead — reads 1.17×, after a five-pass run had put it at 0.88× on mixed signs; the tighter run is the one to believe.

In the interleaved isolated suite `to-alias-redirect` reads **1.53×** of inversify 8.2.3, up from 1.33×, which is what the paired ratio predicts. `child-depth-2-resolve` reads **1.14×** there against 1.36× before — that row carries both of the report's instability markers (above 30M ops/s, and a per-trial IQR over 5%), its own throughput went _up_, and seven paired passes put it at 1.22–1.27×, so the paired number is the one that describes this change. The suite's aggregate moved from 42/0/1 to 42/1/0 at a slightly lower median on rows this change cannot reach, which is run-to-run drift rather than an effect.

`null` is a real answer from that map, meaning "this token's shape needs the full selection path", so absence is tracked by the token slot rather than by the entry, and a registry-version change clears the slot along with the map.

Folding alias hops into `registry.getFastDefault()` instead was considered and rejected as unsound: that index is a bare own-registry `Map.get` returning a binding, while an alias's terminal may live in a parent container and its invalidation depends on the whole chain's summed version, neither of which the registry can see.
