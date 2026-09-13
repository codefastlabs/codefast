# @codefast/benchmark-harness

## 0.9.0

### Minor Changes

- [#861](https://github.com/codefastlabs/codefast/pull/861) [`5c376d5`](https://github.com/codefastlabs/codefast/commit/5c376d5f9ff842103167ae0dd1afd9aed10c0199) Thanks [@thevuong](https://github.com/thevuong)! - Add the primitives a suite needs to derive a report from a run's `observations.jsonl` instead of reading eagerly written
  artifacts: `parseRunObservations` recovers each library's payloads and the run's shape from the file,
  `resolveRunDirectory`/`readRunObservations` locate and read a run (an explicit path, a run id, `latest`, or the newest),
  and `runOrderForShape` reconstructs the run-order caveat from the stamped `isolated` flag. `buildComparisonDocument` now
  accepts the run `shape` as input, falling back to the environment only for a live run, so a report derived from disk
  records the configuration the run actually used rather than the shell's.

- [#861](https://github.com/codefastlabs/codefast/pull/861) [`fcbe338`](https://github.com/codefastlabs/codefast/commit/fcbe338d91de80b9476c41f2168828def26d1435) Thanks [@thevuong](https://github.com/thevuong)! - Add the intra-library comparison axis. A scenario can declare `comparesWithin: "<baseline-scenario-id>"`, and
  `buildIntraLibraryRows` computes, for every library, that scenario's throughput ratio to its baseline (with the same
  reliability marker as a cross-library ratio). The comparison document gains an `intraLibrary` section and the markdown
  report a "Within-group cost" table, both driven by a `baselineOf` map passed to `buildComparisonDocument` /
  `renderComparisonMarkdownReport`. This surfaces within-library costs — such as the price of `tailwind-merge` per feature
  — that the pivot-vs-competitors axis cannot express.

- [#864](https://github.com/codefastlabs/codefast/pull/864) [`a836f8b`](https://github.com/codefastlabs/codefast/commit/a836f8b6b5ab1f16d9943d484e42793ff69f5d1c) Thanks [@thevuong](https://github.com/thevuong)! - Live progress per library. `runBenchLibraries` runs a suite's libraries behind one `ProgressDisplay`: on an interactive
  terminal a block with one line per library — bar, `done/total`, trial ordinal, elapsed time and the scenario in flight —
  redrawn in place with other child output kept above it; piped, under `CI` or with `BENCH_VERBOSE=true`, one plain line
  per milestone plus a heartbeat after ten quiet seconds. The child's stderr progress lines become a protocol
  (`shared/progress.ts` formats and parses them, with a `plan` line so a bar has its total before the first sample), so a
  standalone `bench:<library>` prints the same readable lines a parent consumes. Isolated runs count each library's
  scenarios across its per-scenario children. `renderComparisonConsoleReport` gains `includeScenarioTable`, off by default
  in the suites so the console report is the aggregates; `bench:verbose` prints the table and `bench:report` derives it.

  Colour, via `node:util`'s `styleText` and a shared `createPalette`: the block tints a running library's bar cyan, a
  finished one green and a failed one red; the console report tints a reliable win green, a loss red, and a parity or an
  unreliable cell dim. `NO_COLOR` disables it, `FORCE_COLOR` enables it on a pipe, and cells are padded before they are
  tinted so alignment never depends on colour.

  The console report becomes a scoreboard: one row per competitor with `W · P · L`, comparable count, median, geomean and
  worst loss; a geomean-by-group table with a column per competitor; and the reliable losses one per line. When
  `latest.json` names a run of the same configuration on the same machine, the report diffs against it — `Δ prev` beside
  each aggregate over the rows both runs share, regressions beyond noise listed, improvements counted — and otherwise says
  which configuration it skipped. Every run closes with a card: timing, counts, profile, run order, sanity failures,
  whether `latest.json` moved, library versions, the observations file and the next commands. `writeBenchRunArtifacts` now
  returns what happened to the pointer instead of printing it.

- [#861](https://github.com/codefastlabs/codefast/pull/861) [`765967b`](https://github.com/codefastlabs/codefast/commit/765967bd873d527d17ff7bfbb58d1563edd32438) Thanks [@thevuong](https://github.com/thevuong)! - Persist one file per run. `writeBenchRunArtifacts` now writes only `observations.jsonl` into the run directory and, for
  a whole-suite run, points `bench-results/latest.json` at it with a one-line `{ runId }` — the three-file `latest.*`
  mirror and the eagerly written `report.md`/`report.json` are gone, since both are pure derivations of the observations
  and are rebuilt on demand by `bench:report` and the viewer's report download. `WriteBenchRunArtifactsParameters` drops
  `markdown`, and `BenchRunOutputPaths` now carries `jsonlPath` and `latestPointerPath` in place of the report and mirror
  paths.

- [#865](https://github.com/codefastlabs/codefast/pull/865) [`36081f9`](https://github.com/codefastlabs/codefast/commit/36081f9643067b96f065e0687d78908074490f6f) Thanks [@thevuong](https://github.com/thevuong)! - Scenario tiers and a feature matrix in the listing.

  - A scenario may declare `tier: "contract" | "engine"` and `requires: string[]`; a child reports both per scenario as
    `scenarioListings`, every trial result and observation row carries the tier, and rows written before tiers existed
    read as contract rows.
  - `BENCH_TIER=contract|engine` narrows a run to one tier at both levels, like `BENCH_ONLY`; the comparison document
    records it as `scenarioTier`, the run card names it in the profile line, and a tier-narrowed run leaves `latest.json`
    alone. The comparison document schema is now version 3.
  - A library config may declare `features`. When every library does, the inventory `bench:list` prints splits each row's
    missing libraries into `gaps` (features allow it, nobody wrote it) and `unsupported`, summarises coverage per library
    on stderr, and fails on a library implementing a row while not declaring a feature it requires. Engine rows are owed
    by nobody and count in neither list.
  - `BENCH_BASELINE=<run id or directory>` pins the run the report diffs against instead of the run `latest.json` names;
    `Δ` labels then read `vs baseline <run id>`, and a pinned run that cannot be read throws rather than falling back.
    `readPreviousRun` takes the requested run and `RunDiff` carries `pinned`; `describeDiffTarget` renders the label.

- [#861](https://github.com/codefastlabs/codefast/pull/861) [`06618b6`](https://github.com/codefastlabs/codefast/commit/06618b6c152f899f5cb7e010abfe554c58ddf7c5) Thanks [@thevuong](https://github.com/thevuong)! - Stamp each `observations.jsonl` row with the run's configuration identity — `isolated`, `mode`, and `trialCount` — so a
  reader can tell which execution shape and timing profile produced a measurement rather than plotting incomparable runs
  on one series. The fields are required — a run directory written before this change no longer parses and is dropped from
  the history rather than plotted without a configuration. `resolveRunShapeFromEnvironment` is the one resolver the JSONL
  writer and the comparison `run` block now share, so the two cannot disagree on the configuration a run recorded.

## 0.8.0

### Minor Changes

- [#826](https://github.com/codefastlabs/codefast/pull/826) [`6d1347a`](https://github.com/codefastlabs/codefast/commit/6d1347a1e6a140aafb1dc552175551902993e94b) Thanks [@thevuong](https://github.com/thevuong)! - `bench:serve` now honours the generic `PORT` variable when `BENCH_PORT` is unset, before falling back to the suite's
  default port. A launcher that assigns a free port and announces it through `PORT` — the Claude Code Browser pane with
  `autoPort`, a PaaS — finds the viewer on that port instead of on one the suite chose for itself; `BENCH_PORT` stays the
  explicit override. The harness exposes the precedence as `resolvePreferredPortFromEnvironment(defaultPort)` and the
  `PORT_ENV_KEY` constant, and Turbo passes `PORT` through to `bench:serve`.

## 0.7.2

### Patch Changes

- [#777](https://github.com/codefastlabs/codefast/pull/777) [`05a9ba9`](https://github.com/codefastlabs/codefast/commit/05a9ba98ff2d0ee59d1a4d9f646d5130588c5abb) Thanks [@thevuong](https://github.com/thevuong)! - Move the package from `packages/` to `internal/`, the new home for private workspace packages. The package name and API
  are unchanged.

## 0.7.1

### Patch Changes

- [#748](https://github.com/codefastlabs/codefast/pull/748) [`bde6d1b`](https://github.com/codefastlabs/codefast/commit/bde6d1b46f55f65039f8a3c8e062693fe328952a) Thanks [@thevuong](https://github.com/thevuong)! - Add a summary to every exported declaration whose doc block carried only an `@since` tag.

## 0.7.0

## 0.6.2

## 0.6.1

## 0.6.0

### Minor Changes

- [#724](https://github.com/codefastlabs/codefast/pull/724) [`1a8c0f3`](https://github.com/codefastlabs/codefast/commit/1a8c0f3d001ce2501b7008689c30439fb8b85b5d) Thanks [@thevuong](https://github.com/thevuong)! - Replace the `BENCH_FAST`/`BENCH_FULL` flag pair with `BENCH_MODE`, and parse every on/off key strictly.

  The suite's env surface spelled two different things the same way: `BENCH_TRIALS=3` meant three trials, `BENCH_FAST=1`
  meant true. Reading a manifest could not tell them apart, and every flag was read as `process.env[key] === "1"`, so
  `BENCH_FAST=true`, `=yes`, `=on`, or a value carrying whitespace from a CI file all evaluated to false with no warning —
  the harness ran a profile nobody asked for and nothing downstream could tell that from a real measurement.
  `BENCH_TRIALS` and `BENCH_ONLY` already reported bad input; the booleans were the only keys that failed quietly.

  On/off keys now accept `1`, `true`, `yes` or `on` in any case and throw on anything else instead of reading it as off.
  The timing profile is `BENCH_MODE=fast|default|full`: one key with three values, where a flag per profile could express
  a both-on state that has no meaning and needed a documented tiebreak. `BENCH_FAST` and `BENCH_FULL` are no longer read
  and now throw pointing at their replacement, rather than being an env var that sets nothing while looking like it
  selected a profile.

  The repo's Turbo config also ran in strict env mode without listing `BENCH_ONLY` or `BENCH_ISOLATE` in `passThroughEnv`,
  so both were dropped for any run started from the root — `BENCH_ONLY=<id> pnpm bench:isolate`, the single-row recipe in
  `BENCH_GUIDE.md`, silently benched the entire suite. Both keys now pass through.

- [#724](https://github.com/codefastlabs/codefast/pull/724) [`8fb6921`](https://github.com/codefastlabs/codefast/commit/8fb6921cdb0e15a1414302ef46663f8af2abe8c8) Thanks [@thevuong](https://github.com/thevuong)! - Derive the whole `BENCH_*` surface from one spec map, and close the five ways it could still fail quietly.

  Each key used to declare how it was read at the place it was read, which left four different disciplines in one
  namespace: flags threw on a bad value, `BENCH_TRIALS` warned and substituted the default, and `BENCH_PORT` plus the
  alloc instrument's `OPERATIONS` went through a bare `Number()` with no check at all. `BENCH_ENV_SPECS` now states each
  key's accepted values, who may set it, and which Turbo tasks must pass it through; the parsers, the strip list and the
  drift test all derive from it.

  - `BENCH_LIST` was an internal protocol key on a shared channel: setting it in the shell put every measuring child into
    discovery mode, and the run exited 0 with a well-formed empty comparison that also overwrote `latest.md`. The parent
    now strips internal keys from every inherited child environment and sets them per subprocess, and setting one by hand
    is rejected.
  - Numeric keys take digits only and are range-checked. `BENCH_PORT=` and `BENCH_PORT=0` resolved to `listen(0)`, a
    random port; `BENCH_ALLOC_OPERATIONS=abc` (formerly `OPERATIONS`) made the loop run zero times and the instrument
    report an allocating shape as allocation-free. `BENCH_TRIALS` no longer accepts `3abc` as 3 or reads `1e9` as 1, and
    an out-of-range value throws instead of being replaced by the default.
  - An unknown `BENCH_*` key is rejected. With values validated strictly, a misspelled key was the last way to ask for
    something and be ignored — `BENCH_MODEE=fast` selected nothing and said nothing.
  - The `BENCH_ONLY` subject guard moves into the harness as `assertSubjectMeasuredSomething`. It existed only in the DI
    suite, so a mistyped id in the tailwind-variants suite produced the same empty-but-successful report.
  - A test asserts `turbo.json` passes through every user-facing key and nothing else. That drift is what made
    `BENCH_ONLY` and `BENCH_ISOLATE` silently ineffective from the repo root, and it was invisible until someone read the
    config.

  `OPERATIONS` and `SHAPE` are renamed `BENCH_ALLOC_OPERATIONS` and `BENCH_ALLOC_SHAPE`, so every knob the benchmarks read
  lives in one namespace and is covered by the unknown-key check.

- [#724](https://github.com/codefastlabs/codefast/pull/724) [`33e5d80`](https://github.com/codefastlabs/codefast/commit/33e5d804ae9ac5c9cb18228248781f285b58feeb) Thanks [@thevuong](https://github.com/thevuong)! - Write the comparison as `report.json`, and add `bench:list` for scenario ids.

  A run produced two artifacts: `observations.jsonl`, which is raw per-trial data and already ideal for a machine, and
  `report.md`, which holds every conclusion. The conclusions existed nowhere else — `buildComparisonRows` and
  `summarizeComparison` return full objects with ratios, win/parity/loss classification, per-group geomeans and
  reliability verdicts, and the run handed them to a renderer and dropped them. Reading a ratio back therefore meant
  parsing a fixed-width markdown table whose figures are rounded to three significant figures, with `†`/`‡` glyphs
  encoding thresholds only the renderer knows — lossy enough that a few-percent move is not recoverable.

  `buildComparisonDocument` serialises what was already computed. `report.json` (mirrored to `latest.json`) carries the
  environment, each library at its measured version, every row at full precision with the reliability verdicts resolved to
  booleans, and the head-to-head summaries. It carries a `schemaVersion`, because run directories are kept for historical
  comparison and a silently reinterpreted field is the failure that guards against. Two of these files are a plain dict
  join, so "did this row move between runs" no longer requires reimplementing the aggregate layer.

  `pnpm bench:list` prints the scenario ids as JSON on stdout, with the libraries implementing each row. Asking a suite
  what rows it has previously meant driving the `BENCH_LIST` protocol key against a child entry by hand and regexing the
  framed payload out of its stdout. The parent's progress logging moves to stderr so stdout carries the document alone —
  no framing markers, no last-line heuristic.

  `discoverBenchScenarioIds` replaces the discovery spawn both isolated runners had inlined, and
  `buildBenchRunOutputPaths`/`writeBenchRunArtifacts` replace the run-directory layout and the six write calls each suite
  had its own copy of.

- [#724](https://github.com/codefastlabs/codefast/pull/724) [`6613976`](https://github.com/codefastlabs/codefast/commit/661397662480dd403a18f3a3fcb4117fafb9c43b) Thanks [@thevuong](https://github.com/thevuong)! - Record how a run was invoked, and stop a narrowed run from becoming `latest.*`.

  `latest.*` is a mirror of the newest run, and it carried nothing about how that run was produced. A run filtered to one
  row overwrote it and was indistinguishable from a whole suite except by counting rows — which only helps a reader who
  already knows how many rows the suite has. Since `latest.*` is what CI diffs and what a published figure is checked
  against, a smoke or narrowed pass could quietly become the suite's published state.

  `report.json` now opens with a `run` block: `runId`, `mode`, `isolated`, `scenarioFilter`, `trialCount`, and
  `scenariosMeasured` against `scenariosAvailable`. A filtered run writes its own directory and does not mirror, saying so
  on stdout. A smoke run still mirrors, because `run.mode` is enough to tell it apart from a publishable one. `runOrder`
  moves inside the block, and both it and `scenarioFilter` are explicit `null` rather than absent — `JSON.stringify` drops
  an undefined property, and a reader cannot tell a key meaning "no filter" from one the writer forgot.

  The run directory's basename becomes `runId` and is stamped once by the parent, so a `latest.*` mirror joins back to its
  directory exactly. It previously had to be matched by nearest timestamp, because the name came from the parent while the
  document's own timestamp came from a child a second or so earlier.

  A child now reports every scenario id it collected rather than only in discovery mode, which is what lets the parent
  know the suite's full row count in every profile. `schemaVersion` is 2.

- [#723](https://github.com/codefastlabs/codefast/pull/723) [`2545cdb`](https://github.com/codefastlabs/codefast/commit/2545cdbd8dd54f9a5382bb480373f179a7e3821a) Thanks [@thevuong](https://github.com/thevuong)! - Make `BENCH_ONLY` a scenario filter the parent honours, so one row can be benched through the full report.

  `BENCH_ONLY` was documented child-side and worked only there: `bench:isolate` discovered every scenario id before the
  filter was applied and then overwrote the variable per worker, so an outer value was ignored and the whole suite ran. It
  now accepts a comma-separated list and is read by both isolated runners, which makes
  `BENCH_ONLY=<id> pnpm bench:isolate` a single-row run that is still interleaved and still citable — the lane that
  removes any reason to swap a prebuilt `dist` under the runner, which fails silently because the run rebuilds from source
  before its first sample.

  A library implementing none of the requested ids now measures nothing and reads `—` in the comparison, where it
  previously threw `matched no collected scenario` and took every other library in the run down with it. Guarding against
  a mistyped id moves to the suite, which is the only level that knows which library is the subject.

## 0.5.0

### Minor Changes

- [#674](https://github.com/codefastlabs/codefast/pull/674) [`15b732a`](https://github.com/codefastlabs/codefast/commit/15b732a8ade895dec5df464e9ba30f646e0bf39d) Thanks [@thevuong](https://github.com/thevuong)! - Reshape the comparison report so it stays readable as competitors are added. The per-scenario table now carries the pivot's throughput and one ratio column per competitor — the per-competitor throughput, latency and IQR columns were all derivable from those or from the JSONL, and they grew the table by two columns per library. The head-to-head prose that opened the report is now a **Summary** table with one row per competitor (comparable rows out of the suite, win/parity/loss, median, geomean, unreliable-row count) and a **Geomean by group** matrix, both of which grow downward rather than sideways.

  The IQR column becomes a `‡` cell marker driven by the same ~5% threshold the reports already told readers to apply, alongside the existing `†` marker for ratios that do not reproduce between runs. The "Biggest wins" line is gone: it cherry-picked exactly the high-throughput rows `†` exists to warn against citing.

  `markRatioReliability` is replaced by `markRatioQuality` / `markThroughputQuality`, which take a `ThroughputQuality` per side so a cell's markers and the footnote counts cannot disagree. `formatLatencyMeanMilliseconds` and `formatIqrThroughputFraction` are removed with the columns they served; ratio formatting is unified on `formatRatioMultiple`.

### Patch Changes

- [#677](https://github.com/codefastlabs/codefast/pull/677) [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842) Thanks [@thevuong](https://github.com/thevuong)! - Fairness fixes from an audit of the di-inversify suite:

  - Scenarios can declare `excludeFromAggregates`: the row still renders, but stays out of every median/geomean, and the report names it. Applied to `circular-dependency-3`, whose two sides never did comparable work per op (codefast throws on the 3rd factory entry; inversify 8.2.3 re-enters the user factory 1413 times before its own error) — it alone carried the `failure` group geomean.
  - The isolated runner's rotation now rotates over the libraries that actually implement each scenario. Rotating the full list and then filtering had left the pivot in the first slot for 3 of every 4 head-to-head rows.
  - Every inversify container now runs `{ jitless: false }`, its fastest documented configuration (codegen resolvers, off by default as a CSP-safe fallback).
  - Re-fixtured `scoped-binding-per-child` (inversify side: per-request child + own singleton bind — its idiom for the same user story; it previously failed its own sanity check and silently dropped out), equalized the `to-self-binding` graph, and hoisted the inversify options literals in `resolution-patterns` to match the codefast side.
  - New `realistic-graph-resolved-root` row binds the shared graph via `toResolved`/`toResolvedValue` — the shape both libraries compile ahead of time, comparing each library's best path.
  - The Markdown report now lists rows excluded from aggregates, pivot-only rows, and medians resting on fewer surviving trials than the run scheduled.

- [#677](https://github.com/codefastlabs/codefast/pull/677) [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842) Thanks [@thevuong](https://github.com/thevuong)! - `BENCH_FAST` now runs a single trial per scenario: it is a smoke profile — "does it run and roughly how fast" — and one trial answers that in a third of the time. The default and `BENCH_FULL` profiles keep 3 trials, and an explicit `BENCH_TRIALS` below 3 is still rejected, because those are the profiles a median is quoted from.

- [#646](https://github.com/codefastlabs/codefast/pull/646) [`3044f96`](https://github.com/codefastlabs/codefast/commit/3044f96c4ea8987e8af8583b3b90e0f5c2021105) Thanks [@thevuong](https://github.com/thevuong)! - Raise the minimum per-scenario trial count from 2 to 3 in every profile. A median of two samples is just their mean, so a two-trial run cannot separate a real change from ambient noise — which is exactly the judgement the harness exists to support. `BENCH_TRIALS` now rejects anything below 3.

- [#676](https://github.com/codefastlabs/codefast/pull/676) [`641e233`](https://github.com/codefastlabs/codefast/commit/641e2338d77fb61be2ca585a5986f34cf32ec746) Thanks [@thevuong](https://github.com/thevuong)! - Collapse the `types` and `default` lanes of `package.json#imports` from fallback arrays to single strings.

  Node resolves an imports array by taking the first candidate it can parse, without checking that the file exists and without falling through — a specifier whose first candidate is missing throws `ERR_MODULE_NOT_FOUND` rather than trying the second. `./dist/*/index.js` and `./dist/*/index.d.ts` could therefore never be reached, so they read as a safety net that does not exist. The `source` lane keeps its extension candidates, which only `tsc` and Vite read and both probe.

## 0.5.0-canary.9

### Minor Changes

- [#674](https://github.com/codefastlabs/codefast/pull/674) [`15b732a`](https://github.com/codefastlabs/codefast/commit/15b732a8ade895dec5df464e9ba30f646e0bf39d) Thanks [@thevuong](https://github.com/thevuong)! - Reshape the comparison report so it stays readable as competitors are added. The per-scenario table now carries the pivot's throughput and one ratio column per competitor — the per-competitor throughput, latency and IQR columns were all derivable from those or from the JSONL, and they grew the table by two columns per library. The head-to-head prose that opened the report is now a **Summary** table with one row per competitor (comparable rows out of the suite, win/parity/loss, median, geomean, unreliable-row count) and a **Geomean by group** matrix, both of which grow downward rather than sideways.

  The IQR column becomes a `‡` cell marker driven by the same ~5% threshold the reports already told readers to apply, alongside the existing `†` marker for ratios that do not reproduce between runs. The "Biggest wins" line is gone: it cherry-picked exactly the high-throughput rows `†` exists to warn against citing.

  `markRatioReliability` is replaced by `markRatioQuality` / `markThroughputQuality`, which take a `ThroughputQuality` per side so a cell's markers and the footnote counts cannot disagree. `formatLatencyMeanMilliseconds` and `formatIqrThroughputFraction` are removed with the columns they served; ratio formatting is unified on `formatRatioMultiple`.

### Patch Changes

- [#677](https://github.com/codefastlabs/codefast/pull/677) [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842) Thanks [@thevuong](https://github.com/thevuong)! - Fairness fixes from an audit of the di-inversify suite:

  - Scenarios can declare `excludeFromAggregates`: the row still renders, but stays out of every median/geomean, and the report names it. Applied to `circular-dependency-3`, whose two sides never did comparable work per op (codefast throws on the 3rd factory entry; inversify 8.2.3 re-enters the user factory 1413 times before its own error) — it alone carried the `failure` group geomean.
  - The isolated runner's rotation now rotates over the libraries that actually implement each scenario. Rotating the full list and then filtering had left the pivot in the first slot for 3 of every 4 head-to-head rows.
  - Every inversify container now runs `{ jitless: false }`, its fastest documented configuration (codegen resolvers, off by default as a CSP-safe fallback).
  - Re-fixtured `scoped-binding-per-child` (inversify side: per-request child + own singleton bind — its idiom for the same user story; it previously failed its own sanity check and silently dropped out), equalized the `to-self-binding` graph, and hoisted the inversify options literals in `resolution-patterns` to match the codefast side.
  - New `realistic-graph-resolved-root` row binds the shared graph via `toResolved`/`toResolvedValue` — the shape both libraries compile ahead of time, comparing each library's best path.
  - The Markdown report now lists rows excluded from aggregates, pivot-only rows, and medians resting on fewer surviving trials than the run scheduled.

- [#677](https://github.com/codefastlabs/codefast/pull/677) [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842) Thanks [@thevuong](https://github.com/thevuong)! - `BENCH_FAST` now runs a single trial per scenario: it is a smoke profile — "does it run and roughly how fast" — and one trial answers that in a third of the time. The default and `BENCH_FULL` profiles keep 3 trials, and an explicit `BENCH_TRIALS` below 3 is still rejected, because those are the profiles a median is quoted from.

- [#676](https://github.com/codefastlabs/codefast/pull/676) [`641e233`](https://github.com/codefastlabs/codefast/commit/641e2338d77fb61be2ca585a5986f34cf32ec746) Thanks [@thevuong](https://github.com/thevuong)! - Collapse the `types` and `default` lanes of `package.json#imports` from fallback arrays to single strings.

  Node resolves an imports array by taking the first candidate it can parse, without checking that the file exists and without falling through — a specifier whose first candidate is missing throws `ERR_MODULE_NOT_FOUND` rather than trying the second. `./dist/*/index.js` and `./dist/*/index.d.ts` could therefore never be reached, so they read as a safety net that does not exist. The `source` lane keeps its extension candidates, which only `tsc` and Vite read and both probe.

## 0.5.0-canary.8

### Patch Changes

- [#646](https://github.com/codefastlabs/codefast/pull/646) [`3044f96`](https://github.com/codefastlabs/codefast/commit/3044f96c4ea8987e8af8583b3b90e0f5c2021105) Thanks [@thevuong](https://github.com/thevuong)! - Raise the minimum per-scenario trial count from 2 to 3 in every profile. A median of two samples is just their mean, so a two-trial run cannot separate a real change from ambient noise — which is exactly the judgement the harness exists to support. `BENCH_TRIALS` now rejects anything below 3.

## 0.5.0-canary.7

## 0.5.0-canary.6

## 1.0.0-canary.7

## 1.0.0-canary.6

## 0.5.0-canary.5

## 0.5.0-canary.4

## 0.5.0-canary.3

## 0.5.0-canary.2

## 0.5.0-canary.1

## 0.5.0-canary.0

## 0.4.0

### Patch Changes

- [`f680df9`](https://github.com/codefastlabs/codefast/commit/f680df903510b91c35f1c342d79e50c0672a4c19) Thanks [@thevuong](https://github.com/thevuong)! - Prefer immutable array methods (`toSorted`, `toReversed`) and drop redundant casts in the report quantiles, payload builder, and viewer components.

- [`2397801`](https://github.com/codefastlabs/codefast/commit/239780172d7a71c3426382ec66309ec7f39bd883) Thanks [@thevuong](https://github.com/thevuong)! - chore: align package config globs

- [`f79b333`](https://github.com/codefastlabs/codefast/commit/f79b333d0599c19028f29b9889afcbfb99db91a1) Thanks [@thevuong](https://github.com/thevuong)! - feat(dev): enable source condition for zero-rebuild HMR in apps/docs

- [`f26e846`](https://github.com/codefastlabs/codefast/commit/f26e8460e982171bfde13a7bd3fab4543e933df4) Thanks [@thevuong](https://github.com/thevuong)! - chore(benchmark-harness): export client modules

## 0.4.0-canary.6

## 0.4.0-canary.5

## 0.4.0-canary.4

### Patch Changes

- [#495](https://github.com/codefastlabs/codefast/pull/495) [`7b4e2fd`](https://github.com/codefastlabs/codefast/commit/7b4e2fde5a76fd4452e17b2aff5b94f7d669722b) Thanks [@thevuong](https://github.com/thevuong)! - Prefer immutable array methods (`toSorted`, `toReversed`) and drop redundant casts in the report quantiles, payload builder, and viewer components.

## 0.3.16-canary.3

### Patch Changes

- [`2a82188`](https://github.com/codefastlabs/codefast/commit/2a82188264c204b0b519b3324402ae962594d29b) Thanks [@thevuong](https://github.com/thevuong)! - feat(dev): enable source condition for zero-rebuild HMR in apps/docs

## 0.3.16-canary.2

### Patch Changes

- [`1ad2cb7`](https://github.com/codefastlabs/codefast/commit/1ad2cb73a3f6f8bff2b001e9df2f2492efd89aa2) Thanks [@thevuong](https://github.com/thevuong)! - chore: align package config globs

- [`3620966`](https://github.com/codefastlabs/codefast/commit/36209662115718c1d86566d36df991e98e1c36ab) Thanks [@thevuong](https://github.com/thevuong)! - chore(benchmark-harness): export client modules

## 0.3.16-canary.1

## 0.3.16-canary.0

## 0.3.15
