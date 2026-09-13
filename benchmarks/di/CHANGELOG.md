# @codefast/benchmark-di

## 0.8.0

### Minor Changes

- [#861](https://github.com/codefastlabs/codefast/pull/861) [`5be7d53`](https://github.com/codefastlabs/codefast/commit/5be7d5307ae573bb9436373308c79a08d10d3aa1) Thanks [@thevuong](https://github.com/thevuong)! - Add `bench:report [run]`, which derives `report.md` and `report.json` for a run from its `observations.jsonl` on demand
  — defaulting to the newest run, or taking a run id or path. The comparison assembly (pivot, competitor order, display
  and short names, presentation) is extracted into `src/harness/comparison.ts` so the live run and the derived report
  build the identical comparison from one source.

- [#861](https://github.com/codefastlabs/codefast/pull/861) [`978d166`](https://github.com/codefastlabs/codefast/commit/978d166345630f45465d4e2d148570c7ac744e4e) Thanks [@thevuong](https://github.com/thevuong)! - Bench ditox and injection-js on hierarchical child-scope resolution. Both have real container hierarchy
  (`createContainer(parent)` / `resolveAndCreateChild`), so they now run the `child-depth-2-resolve` row — resolving a
  root-bound constant from a depth-2 child by walking the parent chain — instead of reading `—`. brandi keeps `—`: its
  `clone()` copies bindings rather than linking a parent, so it has no honest equivalent.

- [#861](https://github.com/codefastlabs/codefast/pull/861) [`eb7d819`](https://github.com/codefastlabs/codefast/commit/eb7d8190cb7464cc759e224ad05484ee88db2e84) Thanks [@thevuong](https://github.com/thevuong)! - Expand cross-library coverage so each rival is measured on every feature it natively supports, not just the shared core.
  New feature-fair rows, each using every library's own idiom (mechanism differences documented per row):

  - **resolveAll collection** (`resolve-all-strategies-*`): ditox (`bindMultiValue`), injection-js (`multi: true`) and
    tsyringe (repeated `register`) join `@codefast/di` and inversify — surfacing that ditox and injection-js cache the
    collection array while di, inversify and tsyringe rebuild it.
  - **conditional injection by consumer tag** (`conditional-injection-tagged`): brandi's `when`/`tagged` idiom against
    di's `inject(token, { tag })`.
  - **cold module composition** (`module-cold-from-modules`): inversify (`load`), ditox (`bindModule`) and brandi
    (`use().from()`) against di's `Container.fromModules`.
  - **cold async single-hop** (`async-init-single-hop`): inversify (`getAsync`) and brandi (`AsyncFactory`) against di's
    `resolveAsync`.
  - **per-request scoped lifetime** (`scoped-binding-per-child`): awilix (`createScope` + `scoped()`), tsyringe
    (`ContainerScoped`), brandi (`inContainerScope`) and ditox (scoped `bindFactory`) join di and inversify.
  - **disposal teardown hooks** (`lifecycle-pre-destroy-unbind`): ditox (`onRemoved`) and tsyringe (`dispose()`) join di
    and inversify.

  Awilix stays `—` on disposal (its `dispose()` is async-only), and tagged multi-key resolution stays `@codefast/di`-only
  (inversify's `GetOptions` accepts a single tag).

- [#861](https://github.com/codefastlabs/codefast/pull/861) [`da3bc2d`](https://github.com/codefastlabs/codefast/commit/da3bc2d1fcd6eafb2329ea046a4210bf0ac0998f) Thanks [@thevuong](https://github.com/thevuong)! - Add an `optional-missing-transient` row: a transient class whose one optional dependency is unbound, so every resolve
  reconstructs it and checks the absent optional. `@codefast/di`, brandi and ditox all express it (each has real transient
  scope plus an optional-token form — `optional()` / `token.optional` / `optional()`); injection-js and the container-only
  rivals read `—`, since a cached `get` would check the optional just once.

- [#865](https://github.com/codefastlabs/codefast/pull/865) [`30ce059`](https://github.com/codefastlabs/codefast/commit/30ce059f24b1bce2eb9779caa3fc59f8f398e6c7) Thanks [@thevuong](https://github.com/thevuong)! - Every scenario declares its tier and the public-API features it requires; every library declares the features its API
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
  - `RESULTS.md` is rewritten from a full-profile isolated pass over the 126-row suite (run `2026-09-13T04-45-37-460Z`,
    the baseline a rewrite is read against): registration is priced as the largest deficit, the cold collection pair shows
    the `resolveAll` loss is not only memoisation, the teardown pair shows the deactivation walk is free, and two
    selection lanes no index serves are found against inversify. `alias-cycle-detected` is excluded from the aggregates
    like `circular-dependency-3`.

### Patch Changes

- [#863](https://github.com/codefastlabs/codefast/pull/863) [`ccc5ed1`](https://github.com/codefastlabs/codefast/commit/ccc5ed193f15d9edc7c3e6475a6bfda22e2c6319) Thanks [@thevuong](https://github.com/thevuong)! - Rewrite `benchmarks/di/RESULTS.md` as a single machine-derived snapshot on `@codefast/di` 0.9.0 (full profile,
  GC-exposed, interleaved) instead of an accreted dated ledger, weighting wins and losses equally so the page shows where
  the engine is slower. The snapshot records that `@codefast/di` loses the aggregate to ditox (0.79× median) and the
  geomean to injection-js (0.56×), and breaks down each loss as a real deficit or a by-design work difference — the
  `resolve-all-strategies` collapse (0.03× at N=100) is the rivals returning a memoized collection where `@codefast/di`
  re-gathers per op.

  Assert the A/B method in `BENCH_GUIDE.md`: because `run.ts` rebuilds `packages/di/dist` from `src` unconditionally
  before spawning, swapping the source is the one method, and swapping `dist` directly is a demoted escape hatch that must
  use the child entries. Repoint the `packages/di/ARCHITECTURE.md` tag-chain-walk-memo reference from `RESULTS.md` to the
  package `CHANGELOG.md`, where that A/B now lives.

- [#864](https://github.com/codefastlabs/codefast/pull/864) [`3964ca9`](https://github.com/codefastlabs/codefast/commit/3964ca928c9a13df9e77ffb1837fa9fd65d0b918) Thanks [@thevuong](https://github.com/thevuong)! - Bring the run header, quiet-mode hint, report intro and README prose in line with the six-competitor suite. The library
  list now lives once in `harness/config.ts` (`BENCH_LIBRARIES`, `COMPETITORS`), and the run header, report heading,
  viewer title and per-library runtime lines derive from it, so a new competitor no longer needs a prose edit. The claim
  that only inversify implemented the full suite is gone: inversify covers nearly every shared row, the decorator-free
  containers cover the core plus the scope/lifecycle/module/multi-binding/async rows their APIs express, and injection-js
  its singleton-friendly rows. Every rival gains a `bench:<library>` script for running its child process alone.

  The run now shows live progress per library on an interactive terminal (plain milestones when piped or verbose) and
  prints the aggregates alone by default; `pnpm bench:verbose` prints the per-scenario table and `pnpm bench:report`
  derives it as `report.md`.

  The console report is now a scoreboard with a geomean-by-group table and the reliable losses, diffs against the run
  `latest.json` names when it is the same configuration on the same machine, and closes with a run card.

- Updated dependencies [[`ccc5ed1`](https://github.com/codefastlabs/codefast/commit/ccc5ed193f15d9edc7c3e6475a6bfda22e2c6319), [`5c376d5`](https://github.com/codefastlabs/codefast/commit/5c376d5f9ff842103167ae0dd1afd9aed10c0199), [`fcbe338`](https://github.com/codefastlabs/codefast/commit/fcbe338d91de80b9476c41f2168828def26d1435), [`a836f8b`](https://github.com/codefastlabs/codefast/commit/a836f8b6b5ab1f16d9943d484e42793ff69f5d1c), [`765967b`](https://github.com/codefastlabs/codefast/commit/765967bd873d527d17ff7bfbb58d1563edd32438), [`36081f9`](https://github.com/codefastlabs/codefast/commit/36081f9643067b96f065e0687d78908074490f6f), [`06618b6`](https://github.com/codefastlabs/codefast/commit/06618b6c152f899f5cb7e010abfe554c58ddf7c5), [`e7665ee`](https://github.com/codefastlabs/codefast/commit/e7665eed0afd49310e756d6f86756c4f9accefc5), [`10e8142`](https://github.com/codefastlabs/codefast/commit/10e814253e3e38bbbfc4604473c6e4cb4cef3916), [`eb7d819`](https://github.com/codefastlabs/codefast/commit/eb7d8190cb7464cc759e224ad05484ee88db2e84), [`6c813aa`](https://github.com/codefastlabs/codefast/commit/6c813aa03be010afc8b2e125639341c73f075c3a), [`7d72fd7`](https://github.com/codefastlabs/codefast/commit/7d72fd7e394e3e62ff406dd5ebdb438ff5591346), [`c00ae92`](https://github.com/codefastlabs/codefast/commit/c00ae92ff89b1a7e1d779c17d87cac4ce0066e87), [`1e22a7d`](https://github.com/codefastlabs/codefast/commit/1e22a7deff616c0c80aa2816f8928938a806bbce), [`b26c8a4`](https://github.com/codefastlabs/codefast/commit/b26c8a4008ec87651da2a54f2aa6006c51ab6fc2)]:
  - @codefast/di@0.9.1
  - @internal/benchmark-harness@0.9.0
  - @internal/benchmark-viewer@0.9.0

## 0.7.4

### Patch Changes

- [#826](https://github.com/codefastlabs/codefast/pull/826) [`6d1347a`](https://github.com/codefastlabs/codefast/commit/6d1347a1e6a140aafb1dc552175551902993e94b) Thanks [@thevuong](https://github.com/thevuong)! - `bench:serve` now honours the generic `PORT` variable when `BENCH_PORT` is unset, before falling back to the suite's
  default port. A launcher that assigns a free port and announces it through `PORT` — the Claude Code Browser pane with
  `autoPort`, a PaaS — finds the viewer on that port instead of on one the suite chose for itself; `BENCH_PORT` stays the
  explicit override. The harness exposes the precedence as `resolvePreferredPortFromEnvironment(defaultPort)` and the
  `PORT_ENV_KEY` constant, and Turbo passes `PORT` through to `bench:serve`.
- Updated dependencies [[`6d1347a`](https://github.com/codefastlabs/codefast/commit/6d1347a1e6a140aafb1dc552175551902993e94b), [`c5aa94d`](https://github.com/codefastlabs/codefast/commit/c5aa94d4685c60449673e93a2e1b8b74df7ded67), [`0984174`](https://github.com/codefastlabs/codefast/commit/0984174df148a7cffcd09b837bdde1922f38f24e), [`d0b794c`](https://github.com/codefastlabs/codefast/commit/d0b794c047344c4040b5641202c259d72a0ea48c)]:
  - @codefast/benchmark-harness@0.8.0
  - @codefast/benchmark-viewer@0.8.0
  - @codefast/di@0.9.0

## 0.7.3

### Patch Changes

- Updated dependencies [[`75c63d2`](https://github.com/codefastlabs/codefast/commit/75c63d2abbb713d88489058c1c57bbc6e10f9358), [`05a9ba9`](https://github.com/codefastlabs/codefast/commit/05a9ba98ff2d0ee59d1a4d9f646d5130588c5abb), [`37a212b`](https://github.com/codefastlabs/codefast/commit/37a212b4d805588413159e11e872b98db82326bf), [`ba04d27`](https://github.com/codefastlabs/codefast/commit/ba04d2703c59a1677f52e6a9fffd0ec202328218), [`ad2f93a`](https://github.com/codefastlabs/codefast/commit/ad2f93a688e99c3ed8be6ceeae9d6cdd6be861bc)]:
  - @codefast/benchmark-viewer@0.7.2
  - @codefast/benchmark-harness@0.7.2
  - @codefast/di@0.8.1

## 0.7.2

### Patch Changes

- Updated dependencies [[`96af502`](https://github.com/codefastlabs/codefast/commit/96af502ed8dd7fc02c4440d03b40dc6677b7bcec)]:
  - @codefast/di@0.8.0

## 0.7.1

### Patch Changes

- Updated dependencies [[`bde6d1b`](https://github.com/codefastlabs/codefast/commit/bde6d1b46f55f65039f8a3c8e062693fe328952a), [`bde6d1b`](https://github.com/codefastlabs/codefast/commit/bde6d1b46f55f65039f8a3c8e062693fe328952a)]:
  - @codefast/benchmark-viewer@0.7.1
  - @codefast/di@0.7.1
  - @codefast/benchmark-harness@0.7.1

## 0.7.0

### Patch Changes

- Updated dependencies [[`cafd7ad`](https://github.com/codefastlabs/codefast/commit/cafd7adcb41c3a112c7423a10f72b2856c233f01)]:
  - @codefast/di@0.7.0
  - @codefast/benchmark-harness@0.7.0
  - @codefast/benchmark-viewer@0.7.0

## 0.6.2

### Patch Changes

- Updated dependencies [[`83704d9`](https://github.com/codefastlabs/codefast/commit/83704d96435650946f482f1236ef6633ec19d973)]:
  - @codefast/di@0.6.2
  - @codefast/benchmark-harness@0.6.2
  - @codefast/benchmark-viewer@0.6.2

## 0.6.1

### Patch Changes

- Updated dependencies [[`a8fff29`](https://github.com/codefastlabs/codefast/commit/a8fff29aac58b6e60595de35a613795087b055ab), [`a60bcf8`](https://github.com/codefastlabs/codefast/commit/a60bcf80deeda3964b0bf2e8a6d30aeeb6dc39ab), [`0ee3290`](https://github.com/codefastlabs/codefast/commit/0ee329099359352ed8870d4f8bcfcbb8f2a55126), [`12186d6`](https://github.com/codefastlabs/codefast/commit/12186d698b57a491a7b99d63750ff83199772f35), [`aa76f4d`](https://github.com/codefastlabs/codefast/commit/aa76f4d0559004337f4c0a0aa89b434c26a78d3c)]:
  - @codefast/di@0.6.1
  - @codefast/benchmark-harness@0.6.1
  - @codefast/benchmark-viewer@0.6.1

## 0.6.0

### Patch Changes

- Updated dependencies [[`1a8c0f3`](https://github.com/codefastlabs/codefast/commit/1a8c0f3d001ce2501b7008689c30439fb8b85b5d), [`8fb6921`](https://github.com/codefastlabs/codefast/commit/8fb6921cdb0e15a1414302ef46663f8af2abe8c8), [`33e5d80`](https://github.com/codefastlabs/codefast/commit/33e5d804ae9ac5c9cb18228248781f285b58feeb), [`6613976`](https://github.com/codefastlabs/codefast/commit/661397662480dd403a18f3a3fcb4117fafb9c43b), [`9182664`](https://github.com/codefastlabs/codefast/commit/91826641f284ebf8e7bfcdbdcb3aaf73f77381cb), [`ed1387c`](https://github.com/codefastlabs/codefast/commit/ed1387c7be719ece9a271993834dd23347b5bf6e), [`09e85b8`](https://github.com/codefastlabs/codefast/commit/09e85b87a80143d60c90240ea79de583c0f1ffb2), [`4ceccf2`](https://github.com/codefastlabs/codefast/commit/4ceccf2656ca626215093b85c4111ef8e195c1fd), [`7a103f0`](https://github.com/codefastlabs/codefast/commit/7a103f05b1306f9889f218753a26bc814fc05de3), [`957f438`](https://github.com/codefastlabs/codefast/commit/957f4385612d068162e82f134ec8d995e0819834), [`44dd4a3`](https://github.com/codefastlabs/codefast/commit/44dd4a3cfa886fdf43debc708d6ede9505d71ea5), [`8dfac73`](https://github.com/codefastlabs/codefast/commit/8dfac73fd4278c94bfe20f1554ce3f06c62445ac), [`4a29f20`](https://github.com/codefastlabs/codefast/commit/4a29f2086dd7ad8e9d3a1e429470776478af668c), [`4d472a6`](https://github.com/codefastlabs/codefast/commit/4d472a68b5629f2fba034dae95f302c5db5cb437), [`27020d1`](https://github.com/codefastlabs/codefast/commit/27020d159652ad71f7afe371e29cda1f17097739), [`7feb085`](https://github.com/codefastlabs/codefast/commit/7feb0853292d347d2ea0e7b57d044226e91ca349), [`c415c6b`](https://github.com/codefastlabs/codefast/commit/c415c6bd9466421419fd7d97445fb29f76257d95), [`a4377ff`](https://github.com/codefastlabs/codefast/commit/a4377ff1a2afd5c83a865ce38a93a8573582ffb6), [`f4b1aa6`](https://github.com/codefastlabs/codefast/commit/f4b1aa6335f535574eae5cf559b81a568f5a7a30), [`50448de`](https://github.com/codefastlabs/codefast/commit/50448defd0c94bffe9b824afef46aa42d80114e2), [`08a5f2d`](https://github.com/codefastlabs/codefast/commit/08a5f2d6425960d7674b257196962009ab6279dd), [`c415c6b`](https://github.com/codefastlabs/codefast/commit/c415c6bd9466421419fd7d97445fb29f76257d95), [`e337290`](https://github.com/codefastlabs/codefast/commit/e3372904e67990ea7f5a91e4f7ae014326b7026a), [`3112841`](https://github.com/codefastlabs/codefast/commit/31128417f8ac1212c2861df0e1270ba818324e31), [`22a02b8`](https://github.com/codefastlabs/codefast/commit/22a02b8604e932550474297c8d86fed161385237), [`c415c6b`](https://github.com/codefastlabs/codefast/commit/c415c6bd9466421419fd7d97445fb29f76257d95), [`839efbb`](https://github.com/codefastlabs/codefast/commit/839efbb2318d80acca76b8a02846c30f2ca3306c), [`def51b4`](https://github.com/codefastlabs/codefast/commit/def51b4dea15700b8ad7add488247f2d34147f41), [`801c749`](https://github.com/codefastlabs/codefast/commit/801c7496ec0d7899c98d94bbbb9677005710f91b), [`5d5fe67`](https://github.com/codefastlabs/codefast/commit/5d5fe67d0d8480314fa6a45b40696a57856cf05f), [`3bcb204`](https://github.com/codefastlabs/codefast/commit/3bcb2041e6e154b5fbd3a55a75161a614ce96b77), [`c3403a0`](https://github.com/codefastlabs/codefast/commit/c3403a037f2ab7a9e3cdab15d33c1be2eacadcb4), [`02ea054`](https://github.com/codefastlabs/codefast/commit/02ea0542e4c99b5cf0e59c70ac11673aff85dcee), [`6dcb736`](https://github.com/codefastlabs/codefast/commit/6dcb736a561c527b14b1153a2a4b79d84d28ce79), [`bbc111b`](https://github.com/codefastlabs/codefast/commit/bbc111b61611c1e62924503c6be713a96579dca8), [`2545cdb`](https://github.com/codefastlabs/codefast/commit/2545cdbd8dd54f9a5382bb480373f179a7e3821a), [`bda71f7`](https://github.com/codefastlabs/codefast/commit/bda71f7a2d1121f1abc8d6e575d6779ef5085117)]:
  - @codefast/benchmark-harness@0.6.0
  - @codefast/di@0.6.0
  - @codefast/benchmark-viewer@0.6.0

## 0.5.0

### Patch Changes

- [#677](https://github.com/codefastlabs/codefast/pull/677) [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842) Thanks [@thevuong](https://github.com/thevuong)! - Fairness fixes from an audit of the di-inversify suite:

  - Scenarios can declare `excludeFromAggregates`: the row still renders, but stays out of every median/geomean, and the report names it. Applied to `circular-dependency-3`, whose two sides never did comparable work per op (codefast throws on the 3rd factory entry; inversify 8.2.3 re-enters the user factory 1413 times before its own error) — it alone carried the `failure` group geomean.
  - The isolated runner's rotation now rotates over the libraries that actually implement each scenario. Rotating the full list and then filtering had left the pivot in the first slot for 3 of every 4 head-to-head rows.
  - Every inversify container now runs `{ jitless: false }`, its fastest documented configuration (codegen resolvers, off by default as a CSP-safe fallback).
  - Re-fixtured `scoped-binding-per-child` (inversify side: per-request child + own singleton bind — its idiom for the same user story; it previously failed its own sanity check and silently dropped out), equalized the `to-self-binding` graph, and hoisted the inversify options literals in `resolution-patterns` to match the codefast side.
  - New `realistic-graph-resolved-root` row binds the shared graph via `toResolved`/`toResolvedValue` — the shape both libraries compile ahead of time, comparing each library's best path.
  - The Markdown report now lists rows excluded from aggregates, pivot-only rows, and medians resting on fewer surviving trials than the run scheduled.

- Updated dependencies [[`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`3044f96`](https://github.com/codefastlabs/codefast/commit/3044f96c4ea8987e8af8583b3b90e0f5c2021105), [`15b732a`](https://github.com/codefastlabs/codefast/commit/15b732a8ade895dec5df464e9ba30f646e0bf39d), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`2def688`](https://github.com/codefastlabs/codefast/commit/2def688e305eebe7e14af4ae163beec13582aad5), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`d27b76f`](https://github.com/codefastlabs/codefast/commit/d27b76fb14200ae5226ec2a05b77d44ab91b016c), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`0093b99`](https://github.com/codefastlabs/codefast/commit/0093b99ed711ad037b0e98e7343dee89786d328b), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`19199af`](https://github.com/codefastlabs/codefast/commit/19199af174d8971081d1849a36fd9df05c8541ae), [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90), [`de80bad`](https://github.com/codefastlabs/codefast/commit/de80bad63f14afda1bd64a6d247852b24aac8e16), [`864d213`](https://github.com/codefastlabs/codefast/commit/864d213a4253346dae5799ebba06fc2726e933d2), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`d27b76f`](https://github.com/codefastlabs/codefast/commit/d27b76fb14200ae5226ec2a05b77d44ab91b016c), [`4f7a188`](https://github.com/codefastlabs/codefast/commit/4f7a188a5f4a281882606f11ed660aecb9844753), [`ad11507`](https://github.com/codefastlabs/codefast/commit/ad115077e23eaed845abd1f093f32d57f2445a36), [`d27b76f`](https://github.com/codefastlabs/codefast/commit/d27b76fb14200ae5226ec2a05b77d44ab91b016c), [`f9aeeb0`](https://github.com/codefastlabs/codefast/commit/f9aeeb04a271877e47a7fbbfc6d62ae0fe1ad955), [`6a25788`](https://github.com/codefastlabs/codefast/commit/6a25788320c73074c3ae0bb06cf7a70b7800c953), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90), [`a720c62`](https://github.com/codefastlabs/codefast/commit/a720c6297d041ffd2d0bba2e6146af894007a367), [`1241f82`](https://github.com/codefastlabs/codefast/commit/1241f82bdb40613667c781111f2ce20409ddfd89), [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90), [`4ba70d1`](https://github.com/codefastlabs/codefast/commit/4ba70d1724e19580ee93ee392e413c23e669f310), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90), [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90), [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90), [`641e233`](https://github.com/codefastlabs/codefast/commit/641e2338d77fb61be2ca585a5986f34cf32ec746)]:
  - @codefast/benchmark-harness@0.5.0
  - @codefast/di@0.5.0
  - @codefast/benchmark-viewer@0.5.0

## 0.5.0-canary.9

### Patch Changes

- [#677](https://github.com/codefastlabs/codefast/pull/677) [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842) Thanks [@thevuong](https://github.com/thevuong)! - Fairness fixes from an audit of the di-inversify suite:

  - Scenarios can declare `excludeFromAggregates`: the row still renders, but stays out of every median/geomean, and the report names it. Applied to `circular-dependency-3`, whose two sides never did comparable work per op (codefast throws on the 3rd factory entry; inversify 8.2.3 re-enters the user factory 1413 times before its own error) — it alone carried the `failure` group geomean.
  - The isolated runner's rotation now rotates over the libraries that actually implement each scenario. Rotating the full list and then filtering had left the pivot in the first slot for 3 of every 4 head-to-head rows.
  - Every inversify container now runs `{ jitless: false }`, its fastest documented configuration (codegen resolvers, off by default as a CSP-safe fallback).
  - Re-fixtured `scoped-binding-per-child` (inversify side: per-request child + own singleton bind — its idiom for the same user story; it previously failed its own sanity check and silently dropped out), equalized the `to-self-binding` graph, and hoisted the inversify options literals in `resolution-patterns` to match the codefast side.
  - New `realistic-graph-resolved-root` row binds the shared graph via `toResolved`/`toResolvedValue` — the shape both libraries compile ahead of time, comparing each library's best path.
  - The Markdown report now lists rows excluded from aggregates, pivot-only rows, and medians resting on fewer surviving trials than the run scheduled.

- Updated dependencies [[`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`15b732a`](https://github.com/codefastlabs/codefast/commit/15b732a8ade895dec5df464e9ba30f646e0bf39d), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`641e233`](https://github.com/codefastlabs/codefast/commit/641e2338d77fb61be2ca585a5986f34cf32ec746)]:
  - @codefast/benchmark-harness@0.5.0-canary.9
  - @codefast/di@0.5.0-canary.9
  - @codefast/benchmark-viewer@0.5.0-canary.9

## 0.5.0-canary.8

### Patch Changes

- Updated dependencies [[`3044f96`](https://github.com/codefastlabs/codefast/commit/3044f96c4ea8987e8af8583b3b90e0f5c2021105), [`d27b76f`](https://github.com/codefastlabs/codefast/commit/d27b76fb14200ae5226ec2a05b77d44ab91b016c), [`0093b99`](https://github.com/codefastlabs/codefast/commit/0093b99ed711ad037b0e98e7343dee89786d328b), [`de80bad`](https://github.com/codefastlabs/codefast/commit/de80bad63f14afda1bd64a6d247852b24aac8e16), [`864d213`](https://github.com/codefastlabs/codefast/commit/864d213a4253346dae5799ebba06fc2726e933d2), [`d27b76f`](https://github.com/codefastlabs/codefast/commit/d27b76fb14200ae5226ec2a05b77d44ab91b016c), [`d27b76f`](https://github.com/codefastlabs/codefast/commit/d27b76fb14200ae5226ec2a05b77d44ab91b016c), [`a720c62`](https://github.com/codefastlabs/codefast/commit/a720c6297d041ffd2d0bba2e6146af894007a367), [`1241f82`](https://github.com/codefastlabs/codefast/commit/1241f82bdb40613667c781111f2ce20409ddfd89), [`4ba70d1`](https://github.com/codefastlabs/codefast/commit/4ba70d1724e19580ee93ee392e413c23e669f310)]:
  - @codefast/benchmark-harness@0.5.0-canary.8
  - @codefast/di@0.5.0-canary.8
  - @codefast/benchmark-viewer@0.5.0-canary.8

## 0.5.0-canary.7

### Patch Changes

- Updated dependencies [[`2def688`](https://github.com/codefastlabs/codefast/commit/2def688e305eebe7e14af4ae163beec13582aad5), [`19199af`](https://github.com/codefastlabs/codefast/commit/19199af174d8971081d1849a36fd9df05c8541ae), [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90), [`ad11507`](https://github.com/codefastlabs/codefast/commit/ad115077e23eaed845abd1f093f32d57f2445a36), [`f9aeeb0`](https://github.com/codefastlabs/codefast/commit/f9aeeb04a271877e47a7fbbfc6d62ae0fe1ad955), [`6a25788`](https://github.com/codefastlabs/codefast/commit/6a25788320c73074c3ae0bb06cf7a70b7800c953), [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90), [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90), [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90), [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90), [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90)]:
  - @codefast/di@0.5.0-canary.7
  - @codefast/benchmark-harness@0.5.0-canary.7
  - @codefast/benchmark-viewer@0.5.0-canary.7

## 0.5.0-canary.6

### Patch Changes

- Updated dependencies [[`4f7a188`](https://github.com/codefastlabs/codefast/commit/4f7a188a5f4a281882606f11ed660aecb9844753)]:
  - @codefast/di@0.5.0-canary.6
  - @codefast/benchmark-harness@0.5.0-canary.6
  - @codefast/benchmark-viewer@0.5.0-canary.6

## 1.0.0-canary.7

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@1.0.0-canary.7
  - @codefast/benchmark-viewer@1.0.0-canary.7
  - @codefast/di@1.0.0-canary.7

## 1.0.0-canary.6

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@1.0.0-canary.6
  - @codefast/benchmark-viewer@1.0.0-canary.6
  - @codefast/di@1.0.0-canary.6

## 0.5.0-canary.5

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.5.0-canary.5
  - @codefast/benchmark-viewer@0.5.0-canary.5
  - @codefast/di@0.5.0-canary.5

## 0.5.0-canary.4

### Patch Changes

- Updated dependencies [[`4f7a188`](https://github.com/codefastlabs/codefast/commit/4f7a188a5f4a281882606f11ed660aecb9844753)]:
  - @codefast/di@0.5.0-canary.4
  - @codefast/benchmark-harness@0.5.0-canary.4
  - @codefast/benchmark-viewer@0.5.0-canary.4

## 0.5.0-canary.3

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.5.0-canary.3
  - @codefast/benchmark-viewer@0.5.0-canary.3
  - @codefast/di@0.5.0-canary.3

## 0.5.0-canary.2

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.5.0-canary.2
  - @codefast/benchmark-viewer@0.5.0-canary.2
  - @codefast/di@0.5.0-canary.2

## 0.5.0-canary.1

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.5.0-canary.1
  - @codefast/benchmark-viewer@0.5.0-canary.1
  - @codefast/di@0.5.0-canary.1

## 0.5.0-canary.0

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.5.0-canary.0
  - @codefast/benchmark-viewer@0.5.0-canary.0
  - @codefast/di@0.5.0-canary.0

## 0.4.0

### Patch Changes

- [`f79b333`](https://github.com/codefastlabs/codefast/commit/f79b333d0599c19028f29b9889afcbfb99db91a1) Thanks [@thevuong](https://github.com/thevuong)! - feat(dev): enable source condition for zero-rebuild HMR in apps/docs

- Updated dependencies [[`f680df9`](https://github.com/codefastlabs/codefast/commit/f680df903510b91c35f1c342d79e50c0672a4c19), [`2397801`](https://github.com/codefastlabs/codefast/commit/239780172d7a71c3426382ec66309ec7f39bd883), [`172720f`](https://github.com/codefastlabs/codefast/commit/172720f8e7a7d65d653fb9b20bbb47a770b2f713), [`dd9e844`](https://github.com/codefastlabs/codefast/commit/dd9e844608142792f0f6519d552eb2bcbe6c4bc3), [`e0e4aae`](https://github.com/codefastlabs/codefast/commit/e0e4aaee087057668cd1e2ef4cacc83bc4eb833f), [`f79b333`](https://github.com/codefastlabs/codefast/commit/f79b333d0599c19028f29b9889afcbfb99db91a1), [`ebdf9e3`](https://github.com/codefastlabs/codefast/commit/ebdf9e396d3c3a826f05f278c93d391a0ae5ca45), [`6c3ac44`](https://github.com/codefastlabs/codefast/commit/6c3ac44b7ddb9e5bcf3fbe0757e00ef86f27b513), [`f26e846`](https://github.com/codefastlabs/codefast/commit/f26e8460e982171bfde13a7bd3fab4543e933df4), [`8fc1299`](https://github.com/codefastlabs/codefast/commit/8fc129956d353e1e31a2c1a364792484a85a53a1)]:
  - @codefast/benchmark-harness@0.4.0
  - @codefast/benchmark-viewer@0.4.0
  - @codefast/di@0.4.0

## 0.4.0-canary.6

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.4.0-canary.6
  - @codefast/benchmark-viewer@0.4.0-canary.6
  - @codefast/di@0.4.0-canary.6

## 0.4.0-canary.5

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.4.0-canary.5
  - @codefast/benchmark-viewer@0.4.0-canary.5
  - @codefast/di@0.4.0-canary.5

## 0.4.0-canary.4

### Patch Changes

- Updated dependencies [[`7b4e2fd`](https://github.com/codefastlabs/codefast/commit/7b4e2fde5a76fd4452e17b2aff5b94f7d669722b), [`a66946d`](https://github.com/codefastlabs/codefast/commit/a66946d7b4f249927caea567232a9c05cd861020), [`fa338d6`](https://github.com/codefastlabs/codefast/commit/fa338d61fbfafb94beaa4d05d93d01e2c005cc91)]:
  - @codefast/benchmark-harness@0.4.0-canary.4
  - @codefast/benchmark-viewer@0.4.0-canary.4
  - @codefast/di@0.4.0-canary.4

## 0.3.16-canary.3

### Patch Changes

- [`2a82188`](https://github.com/codefastlabs/codefast/commit/2a82188264c204b0b519b3324402ae962594d29b) Thanks [@thevuong](https://github.com/thevuong)! - feat(dev): enable source condition for zero-rebuild HMR in apps/docs

- Updated dependencies [[`6149d30`](https://github.com/codefastlabs/codefast/commit/6149d30a3c20f1f4324b140525b6374a935aaabd), [`2a82188`](https://github.com/codefastlabs/codefast/commit/2a82188264c204b0b519b3324402ae962594d29b), [`bed2f30`](https://github.com/codefastlabs/codefast/commit/bed2f30df74128fe3b1a98dd9d03f6bb96099164)]:
  - @codefast/benchmark-viewer@0.3.16-canary.3
  - @codefast/benchmark-harness@0.3.16-canary.3
  - @codefast/di@0.3.16-canary.3

## 0.3.16-canary.2

### Patch Changes

- Updated dependencies [[`1ad2cb7`](https://github.com/codefastlabs/codefast/commit/1ad2cb73a3f6f8bff2b001e9df2f2492efd89aa2), [`4fda78b`](https://github.com/codefastlabs/codefast/commit/4fda78b20f98646d114cfddb09e66af609a625a2), [`3620966`](https://github.com/codefastlabs/codefast/commit/36209662115718c1d86566d36df991e98e1c36ab), [`1b0df2e`](https://github.com/codefastlabs/codefast/commit/1b0df2e55140c927b7f3ba39ccdcb4cba87ec7ff)]:
  - @codefast/benchmark-harness@0.3.16-canary.2
  - @codefast/di@0.3.16-canary.2

## 0.3.16-canary.1

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.3.16-canary.1
  - @codefast/di@0.3.16-canary.1

## 0.3.16-canary.0

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.3.16-canary.0
  - @codefast/di@0.3.16-canary.0

## 0.3.15

### Patch Changes

- Updated dependencies [[`8492085`](https://github.com/codefastlabs/codefast/commit/849208521571b18a3af1f36566c3111a5af01b7c), [`4df6e65`](https://github.com/codefastlabs/codefast/commit/4df6e6579faf21c6dc7622eb424ad213b120dabb)]:
  - @codefast/di@0.3.15
  - @codefast/benchmark-harness@0.3.15
