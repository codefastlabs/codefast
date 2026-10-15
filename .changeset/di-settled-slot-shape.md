---
"@codefast/di": patch
---

Every dependency slot the engine resolves now has one shape: a class's parameters are copied once when they are settled,
and a factory's dependencies when it is bound or declared, each with its resolve options and criterion already filled. A
process that has resolved many kinds of slot no longer meets the cold class lane megamorphic, so booting an application
gets faster where it was slowest — `app-boot-40` +13%, `realistic-graph-class-cold-resolve` +16% and the interpreted
`slot-injected-*` rows +31% in a paired run — with the warm rows level.
