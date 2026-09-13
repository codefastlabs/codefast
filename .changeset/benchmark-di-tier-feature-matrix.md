---
"@benchmark/di": minor
---

Every scenario declares its tier and the public-API features it requires; every library declares the features its API
offers.

- 86 `contract` rows are specified against the public API and survive an engine rewrite; 25 `engine` rows name a lane of
  the current resolver (compiled plans and their escapes, the tag-key mask, the hoisted-versus-inline options object,
  the async branch lane) and are instrumentation owed by no other library. `BENCH_TIER=contract pnpm bench:isolate` runs
  the comparison without them.
- `src/fixtures/features.ts` is the feature vocabulary; `src/harness/config.ts` declares each library's features, read
  from its installed typings. `pnpm bench:list` now reports per library which rows it owes (gaps) apart from the rows it
  cannot express, and fails when a library implements a row whose required feature it does not declare.
- The production rows and the child-scope rows now run on every library whose API has a child and a teardown: awilix
  (`createScope` + `dispose`), tsyringe (`createChildContainer` + `dispose`, `instancePerContainerCachingFactory` for
  the per-operation unit of work) and ditox (`createContainer(parent)` + `removeAll`); brandi gains the depth-2 child
  row over an `extend()` chain and injection-js the event-bus row over its cached `multi: true` array. 15 rows, each
  with a `what` naming the mechanism.
- A class lane for the realistic graph: `realistic-graph-class-resolve-root` and `realistic-graph-class-cold-resolve`
  wire the same ten nodes as constructor-injected classes in each library's own class idiom (`@injectable([deps])`,
  `@injectable` + `@inject`, `asClass` off the proxy cradle, `injected()`, `injectableClass()`, `@Injectable` +
  `@Inject`), on all seven libraries. `src/fixtures/realistic-class-graph.ts` holds the one sanity every side runs: the
  tree matches the descriptor node for node, singletons are one instance wherever they appear, the root is fresh per
  resolve. The `class-injection` feature names what the rows require.
