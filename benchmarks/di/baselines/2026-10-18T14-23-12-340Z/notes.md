Measured at `cda9d6d26` — the previous baseline's tree plus `@inject`-accessor classes compiled into async plans
(#1113), typed error codes and a `@postConstruct` error that names its token (#1115), the type-only `Binder` and
`@injectable()` fixes (#1119), one module factory and `injectOptional` (#1120), and a docs fix (#1121) — from a `dist`
built first. 2m22s wall.

**What moved since the previous pass (`2026-10-18T07-56-19-799Z`, at `dbae5d4cc`).** Nothing the engine did. Every
library reads about 1% slower per row than in the previous pass, 0.985× to 0.998×, and codefast's median row reads
0.990×, the same drift.

The harness flags twelve rows at −5% to −13% — eight `plan-*` rows, `app-boot-40`, `multi-tag-constraint-resolve`,
`accessor-injection-construct`, `resolve-all-named-8`, `bind-128-refined` and `fresh-child-default-n4` among them — and
three at +8% to +18%. The renames break `bench:ab` across the two trees, so they were paired as two full checkouts: four
alternating narrowed runs of `dbae5d4cc` against this tree read every flagged row at 0.986× to 1.018×, canaries at
1.006× and 1.001×. `accessor-injection-construct`, the one left below parity at 0.92×, took six more pairs and read
0.972× with the two sides' ranges overlapping, and a standalone probe of its lane, built by `tsc`, reads 30.4–31.5 ns on
this tree against 30.2–32.6 ns on the previous one: pass noise.

`app-boot-40` now reads 0.94× ditox where it read 0.99×. codefast's own row did not move in the paired runs; its three
trials spread from 95.8K to 109.9K ops/s while ditox's sat within 3%. The row sits at the registration floor, at parity
with ditox give or take a pass, so it joins that note's losses.
