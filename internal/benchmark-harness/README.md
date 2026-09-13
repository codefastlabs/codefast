# @internal/benchmark-harness

Shared [tinybench](https://github.com/tinylibs/tinybench) harness for the `benchmarks/*` suites: a parent/child
subprocess protocol, environment fingerprinting, strict `BENCH_*` environment parsing, and one comparison report that
renders a pivot library against any number of competitors.

> **Private workspace package.** Never published to npm. It is consumed only by the benchmark suites in this repository
> through `workspace:*`.

- **One process per library.** Each library benchmarks in its own subprocess under its own tsconfig, so no two libraries
  share a heap and nothing is forced into another library's idiom.
- **Isolated runs are interleaved.** With `BENCH_ISOLATE=true` every library measures a scenario before the next
  scenario starts, and the starting library rotates, so drift over the run cannot land on one side of a ratio.
- **The report travels with its caveats.** Cells the reader should not cite carry a marker, the summary counts them, and
  every figure the markdown rounds is kept at full precision in `report.json`.
- **Nothing in `BENCH_*` fails quietly.** An unknown key, a misspelled value, or an out-of-range number throws before
  the run starts instead of silently measuring something else.

## Layout

The package is organised by role in the subprocess model. Every module is also reachable as a subpath export
(`@internal/benchmark-harness/parent/run-bench-subprocess`, and so on); the root export re-exports all of them.

| Area       | Owns                                                                                                                                                                                                                          |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared/*` | The framed stdout protocol (`emitSubprocessPayload`, `extractSubprocessPayload`), the `BENCH_*` spec map and its parsers (`env-keys`), and the `BenchSubprocessConfig` a suite declares per library                           |
| `child/*`  | What runs inside a bench subprocess: `runBenchmarkChildMain` (sanity checks, trials, payload), `createRunAllTrials`, `runSanityChecks`, `collectFingerprint`, the `BenchScenario` types, and the default tinybench options    |
| `parent/*` | What the suite entry runs: `runBenchSubprocess`, `runBenchSubprocessesInterleaved`, `discoverBenchScenarioIds`, `isIsolatedBenchRunRequested`, `writeBenchRunArtifacts`, `runBenchScenarioListingMain`, exit-code resolution  |
| `report/*` | Aggregation and quantiles, the pivot-vs-competitors tables and summaries (`comparison`), the `report.json` document (`comparison-document`), the reliability markers (`reliability`), JSONL row helpers, and the file writers |

## Two execution shapes

**Shared** (`runBenchSubprocess`): one child per library runs that library's whole suite. This approximates a long-lived
application, but earlier scenarios train the library's hot-path inline caches for later ones, so rows are
order-dependent — and libraries run one after another, so any drift over the run lands on whoever ran later. The report
states this run order and treats cross-library ratios from it as provisional.

**Isolated** (`runBenchSubprocessesInterleaved`, opted into with `BENCH_ISOLATE=true`): one child **per scenario** per
library. A discovery child (`BENCH_LIST`) reports each library's scenario ids, then `BENCH_ONLY=<id>` workers run one
scenario each. The parent schedules scenario-major — every library on the same scenario before the next scenario — and
rotates which library goes first, then merges the trials back into one payload per library. Order-independent, and the
only shape whose cross-library ratios the report considers citable.

## The report

Reports open with a **summary table, one row per competitor**: comparable rows, win/parity/loss counts inside a narrow
parity band, median and geomean ratios, and how many of those rows carry the unreliable marker. A geomean-by-group
matrix follows, which keeps error-path groups separate from throughput groups, then the loss and parity lists. The
per-scenario table below them carries the pivot's throughput and one ratio column per competitor. A scenario can declare
`excludeFromAggregates` to stay in the table but out of the medians and geomeans, for rows whose two sides do
incomparable amounts of work.

Two markers qualify a cell:

- `†` (`UNRELIABLE_RATIO_MARKER`): the row's throughput sits above `THROUGHPUT_NOISE_CEILING_HZ_PER_OP`, where a single
  row's ratio moves between runs of the same build whatever its IQR says.
- `‡` (`NOISY_IQR_MARKER`): the cell's per-trial IQR exceeds `NOISY_IQR_FRACTION`, so its median is unstable within the
  run that printed it.

`collectFingerprint` stamps every payload with the runtime environment — Node and V8 versions, platform, CPU model and
count, `NODE_OPTIONS`, whether `gc` is exposed, and the measured library's installed version — so historical results
stay comparable.

## Run artifacts

A run persists exactly one file. `writeBenchRunArtifacts` writes `observations.jsonl` into a timestamped directory under
`bench-results/`, and — when the run is the whole suite — points `bench-results/latest.json` at it with a one-line
`{ runId }`:

| File                 | For                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `observations.jsonl` | Raw per-trial rows, one per `(library, trial, scenario)`, with the fingerprint and the run's config identity on every row |
| `latest.json`        | A pointer — the `runId` of the newest whole-suite run                                                                     |

The comparison document and the markdown report are **derived on demand**, never persisted next to the trials:
`parseRunObservations` recovers each library's payloads and the run's shape from the one file, and a suite's
`bench:report` (or the viewer's report download) rebuilds `report.md`/`report.json` from them. Each observation row
carries `isolated`, `mode` and `trialCount`, so a report derived from disk records the configuration the run actually
used rather than the shell's.

**A filtered run does not move `latest.json`.** It writes its own directory and says so on stdout; `latest.json` has to
mean the whole suite. A run whose subject measured no rows does not move it either.

## Environment keys

Suite-level knobs are environment-driven. [`src/shared/env-keys.ts`](./src/shared/env-keys.ts) is the single source:
`BENCH_ENV_SPECS` declares each key's accepted values, who may set it, and which Turbo tasks must pass it through. The
parsers, the keys the parent strips before spawning a child, and an integration test asserting `turbo.json` lists every
user-facing key all derive from that map. Turbo runs in strict env mode, so a key missing from `passThroughEnv` is
dropped for any run started at the repo root — which looks exactly like the key having no effect.

| Key                    | Effect                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| `BENCH_MODE=fast`      | Smoke profile: shorter sampling windows, a single trial. Never a citable number                   |
| `BENCH_MODE=default`   | The default profile — the same as leaving `BENCH_MODE` unset                                      |
| `BENCH_MODE=full`      | Extended profile: `--expose-gc` in every child, with collections forced into the measured loop    |
| `BENCH_TRIALS=<n>`     | Trials per scenario; the harness refuses anything below `MINIMUM_TRIAL_COUNT`                     |
| `BENCH_ISOLATE=true`   | One subprocess per scenario, libraries interleaved                                                |
| `BENCH_ONLY=<id>,<id>` | Restrict the run to these scenario ids; a library implementing none of them measures nothing      |
| `BENCH_TIER=<tier>`    | Restrict the run to one scenario tier, `contract` or `engine`; a narrowed run like `BENCH_ONLY`   |
| `BENCH_VERBOSE=true`   | Forward each child's stdout through the parent                                                    |
| `BENCH_PORT=<n>`       | Preferred port for a suite's `bench:serve`                                                        |
| `PORT=<n>`             | Read by `bench:serve` when `BENCH_PORT` is unset: the port a launcher hands the process it starts |

On/off keys accept `1`, `true`, `yes` or `on` in any case. Numeric keys take digits only and are range-checked, so
`BENCH_TRIALS=3abc` and `BENCH_PORT=0` are errors rather than a silently different number. An unknown `BENCH_*` key is
rejected too — `BENCH_MODEE=fast` would otherwise select nothing and say nothing. `BENCH_MODE` is one key with three
values rather than a flag per profile because the profiles are mutually exclusive. `BENCH_LIST` is internal to the
parent/child protocol: the parent sets it per discovery child and strips it from every inherited environment.

Each suite's `bench:list` script (`runBenchScenarioListingMain`) prints the scenario inventory as JSON on stdout — every
id, its tier, the features it requires and which libraries implement it, the list a `BENCH_ONLY` filter needs. Discovery
progress goes to stderr, so stdout is the JSON document alone.

### Tiers and the feature matrix

A scenario may declare a `tier`. A `contract` row measures public API and is what the libraries are compared on; an
`engine` row measures one library's internals, is owed by nobody else, and is deleted with the engine it names. A
scenario that declares none is a contract row. `BENCH_TIER=contract` runs one tier and is a narrowed run: it writes its
own directory and leaves `latest.json` alone, so a cross-library run can skip the subject's instrumentation without
becoming the suite's published state. Every observation row records its tier.

A scenario may also declare `requires`, the features of a library's public API it cannot be written without, and each
library config may declare `features`, the ones its API offers — both in the suite's own vocabulary. When every library
declares, the inventory splits the libraries missing a row into `gaps` (their features allow it, nobody wrote it) and
`unsupported` (they cannot express it, so `—` is the honest cell), and prints a coverage line per library on stderr. A
library implementing a row while not declaring a feature it requires fails the listing, because the matrix is only worth
reading while the declarations are true.

## Usage

From the repo root:

```bash
pnpm bench            # run every suite, shared profile
pnpm bench:isolate    # run every suite, one subprocess per scenario, interleaved
pnpm bench:fast       # smoke profile — shorter windows, for "did I break it"
pnpm bench:full       # --expose-gc for every library
pnpm bench:verbose    # stream every child line and print the per-scenario table
pnpm bench:list       # every suite's scenario inventory as JSON, measuring nothing
pnpm bench:report     # derive report.md / report.json from each suite's latest run
pnpm bench:serve      # browse recorded runs (see ../benchmark-viewer)
```

Every root script has a `di:` and a `tv:` twin (`pnpm di:bench:fast`, `pnpm tv:bench:list`, …) that filters to one
suite; the per-library child entries (`bench:<library>`) stay suite-local.

## Progress display

A run reports through one `ProgressDisplay` (`src/parent/progress/`), chosen by `createProgressDisplay` from what stderr
can draw. On an interactive terminal it is a live block — one line per library with a bar, `done/total`, the trial
ordinal when a profile runs more than one, elapsed time and the scenario in flight — redrawn in place, with any other
child output kept above it. Piped, under `CI`, or with `BENCH_VERBOSE=true`, it is one plain line per milestone instead,
plus a "still running" heartbeat after ten quiet seconds, so a log stays readable.

The child does not know which display it feeds. Its stderr lines are the protocol: `src/shared/progress.ts` holds the
formatter the child prints with and the parser the parent reads with, so `bench:<library>` run alone prints the same
readable lines a parent consumes, and a round-trip test pins the format. An isolated run counts a library's scenarios
across its per-scenario children; the scheduler tells the display the total after discovery.

Both the block and the console report colour their verdicts through `node:util`'s `styleText`, resolved once per stream
by `createPalette`: a reliable win green, a loss red, a parity or an unreliable cell dim, a finished library green and a
failed one red. `NO_COLOR` turns it off, `FORCE_COLOR` turns it on for a pipe, and every cell is padded before it is
tinted, so alignment never depends on colour.

The console report is a scoreboard, not a table. One row per competitor carries `W · P · L`, the comparable count, the
median and geomean ratio and the worst loss; a second table gives the geomean per scenario group with one column per
competitor; the reliable losses follow one per line, with the count of losses hidden because they sit above the
throughput noise ceiling. The per-scenario table prints only in verbose mode, and `bench:report` derives it as
`report.md`.

When `latest.json` names a run of the same configuration — shape, profile and trial count — on the same CPU, Node and
architecture, the report also diffs against it (`src/report/run-diff.ts`): a `Δ prev` column beside each aggregate,
computed over the rows both runs measured; a list of regressions beyond noise, where a scenario's subject throughput
fell by more than the larger of the noise floor and either side's IQR fraction, rows above the noise ceiling excluded;
and the count of improvements beyond noise. A run of another configuration is named and skipped rather than compared.
The previous run is read before the artifacts are written, while the pointer still names it.

A run closes with a card (`src/report/run-card.ts`): wall and rebuild time, library and row counts, the profile, the run
order and what it means for citing ratios, sanity failures by library, whether `latest.json` moved, every library's
version, the observations file and the next commands.

A suite wires the harness in two files. Its parent entry runs every library with `runBenchLibraries` (which picks the
run shape and the progress display), builds a `LibraryReport` per payload with `buildLibraryReport`, renders
`renderComparisonMarkdownReport` and `renderComparisonConsoleReport`, builds the `report.json` document with
`buildComparisonDocument`, and hands everything to `writeBenchRunArtifacts`. Each child entry calls
`runBenchmarkChildMain` with the library's scenario collector. [`../../benchmarks/di`](../../benchmarks/di) and
[`../../benchmarks/tailwind-variants`](../../benchmarks/tailwind-variants) are the two consumers.

## Documentation

- [`CHANGELOG.md`](./CHANGELOG.md) — release notes for this package.
- [`../benchmark-viewer`](../benchmark-viewer) — the server and browser app that read the JSONL these runs write.
- [`../../benchmarks/di/BENCH_GUIDE.md`](../../benchmarks/di/BENCH_GUIDE.md) — the measurement standard the suites hold
  a number to, written against this harness.

## Contributing

See the repository [`CONTRIBUTING.md`](../../CONTRIBUTING.md).

## License

Released under the [MIT License](../../LICENSE).
