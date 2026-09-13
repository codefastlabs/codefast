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
- Each loss `RESULTS.md` reports is now a pair whose difference isolates the mechanism. `resolve-all-cold-10/-100` build
  a fresh container and read the collection once, so a memoised array (ditox, injection-js) is charged for the build the
  stable row never pays. `materialize-100-singletons` and `unbind-all-100-singletons` move into the shared descriptors
  and run on inversify (`@preDestroy` + `unbindAll`), awilix (`disposer` + awaited `dispose`), tsyringe (`Disposable` +
  `dispose`) and ditox (`onRemoved` + `removeAll`), so the teardown walk reads apart from the single unbind.
  `container-create-empty`, `create-child-empty` and `bind-128-plain` move into the shared descriptors and run on all
  seven libraries, so a cold graph row's first resolve becomes subtractable from its bind and construction.
- Two scale axes. `child-depth-1/2/4/8-resolve` replaces the single depth-2 child row on all seven libraries, so a
  parent walk that is free reads apart from one that is linear in the chain. `named-resolve-slots-1/4/16/64` and
  `tagged-resolve-slots-1/4/16/64` pick the last-bound name or tag out of N bindings on one token, on codefast and
  inversify, so a selection that is indexed reads apart from one that scans.
- `src/fixtures/sanity.ts` holds the semantic checks every head-to-head row shares — fresh per resolve down to the
  dependency, one instance within a scope and a fresh one across, every binding of a collection present once — and the
  transient, scoped and `resolveAll` rows on every library call the same one, so no side can measure a cheaper meaning
  of the feature under the same id.
- `BENCH_GUIDE.md` gains the recipe a rewrite is measured by: run the contract tier once at the citable profile, pin
  that run with `BENCH_BASELINE`, and read every later run against it.
- Every gap the matrix reported is closed: each library now implements every row its declared features allow, in its own
  idiom — inversify 93 rows, ditox 44, tsyringe 43, awilix 40, injection-js 33, brandi 29 of 126. The last codefast-only
  descriptors (aliases, fresh-child matrix, async entry points, chain rebind, nested factories, property injection,
  refined bind, the six public slot rows) moved into the shared descriptors, and the six public slot rows now count in
  the aggregates. Two features split so the matrix stays true: `optional-injection` (dependency-site, which awilix's
  cradle cannot express) from `optional`, and `binding-activation-hook` (per binding, which tsyringe's interceptors
  cannot express) from `activation-hook`.
