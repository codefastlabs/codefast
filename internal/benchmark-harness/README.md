# @codefast/benchmark-harness

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
(`@codefast/benchmark-harness/parent/run-bench-subprocess`, and so on); the root export re-exports all of them.

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

`writeBenchRunArtifacts` writes three files into a timestamped directory under `bench-results/` and mirrors them to
stable `latest.*` names:

| File                 | For                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `report.md`          | Reading. Rounded figures, the `†`/`‡` markers, and the prose that frames the comparison     |
| `report.json`        | Querying. The same comparison as data — full-precision ratios, reliability as booleans      |
| `observations.jsonl` | Raw per-trial rows, one per `(library, trial, scenario)`, with the fingerprint on every row |

Every `report.json` opens with a `run` block — `runId`, `mode`, `isolated`, `scenarioFilter`, `trialCount`, and
`scenariosMeasured` against `scenariosAvailable` — so a run narrowed to one row cannot be mistaken for a whole suite.
`runId` is the run-directory basename, which joins a `latest.*` mirror back to its directory exactly.

**A filtered run does not move `latest.*`.** It writes its own directory and says so on stdout. `latest.*` is what CI
diffs and what a published figure is checked against, so it has to mean the whole suite. A run whose subject measured no
rows is not mirrored either. A smoke run does mirror; `run.mode` is how you tell it apart from a publishable one.

`report.json` exists because `report.md` is a lossy projection: a rounded ratio cannot resolve a small gap, and the
markers encode thresholds only the renderer knows. `buildComparisonDocument` keeps every figure computed on the way to
the markdown, so two `report.json` files are a plain dictionary join.

## Environment keys

Suite-level knobs are environment-driven. [`src/shared/env-keys.ts`](./src/shared/env-keys.ts) is the single source:
`BENCH_ENV_SPECS` declares each key's accepted values, who may set it, and which Turbo tasks must pass it through. The
parsers, the keys the parent strips before spawning a child, and an integration test asserting `turbo.json` lists every
user-facing key all derive from that map. Turbo runs in strict env mode, so a key missing from `passThroughEnv` is
dropped for any run started at the repo root — which looks exactly like the key having no effect.

| Key                    | Effect                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| `BENCH_MODE=fast`      | Smoke profile: shorter sampling windows, a single trial. Never a citable number                |
| `BENCH_MODE=default`   | The default profile — the same as leaving `BENCH_MODE` unset                                   |
| `BENCH_MODE=full`      | Extended profile: `--expose-gc` in every child, with collections forced into the measured loop |
| `BENCH_TRIALS=<n>`     | Trials per scenario; the harness refuses anything below `MINIMUM_TRIAL_COUNT`                  |
| `BENCH_ISOLATE=true`   | One subprocess per scenario, libraries interleaved                                             |
| `BENCH_ONLY=<id>,<id>` | Restrict the run to these scenario ids; a library implementing none of them measures nothing   |
| `BENCH_VERBOSE=true`   | Forward each child's stdout through the parent                                                 |
| `BENCH_PORT=<n>`       | Preferred port for a suite's `bench:serve`                                                     |

On/off keys accept `1`, `true`, `yes` or `on` in any case. Numeric keys take digits only and are range-checked, so
`BENCH_TRIALS=3abc` and `BENCH_PORT=0` are errors rather than a silently different number. An unknown `BENCH_*` key is
rejected too — `BENCH_MODEE=fast` would otherwise select nothing and say nothing. `BENCH_MODE` is one key with three
values rather than a flag per profile because the profiles are mutually exclusive. `BENCH_LIST` is internal to the
parent/child protocol: the parent sets it per discovery child and strips it from every inherited environment.

Each suite's `bench:list` script (`runBenchScenarioListingMain`) prints the scenario inventory as JSON on stdout — every
id and which libraries implement it, the list a `BENCH_ONLY` filter needs. Discovery progress goes to stderr, so stdout
is the JSON document alone.

## Usage

From the repo root:

```bash
pnpm bench            # run every suite, shared profile
pnpm bench:isolate    # run every suite, one subprocess per scenario, interleaved
pnpm bench:serve      # browse recorded runs (see ../benchmark-viewer)
```

A suite wires the harness in two files. Its parent entry spawns one child per library with `runBenchSubprocess` or
`runBenchSubprocessesInterleaved`, builds a `LibraryReport` per payload with `buildLibraryReport`, renders
`renderComparisonMarkdownReport` and `renderComparisonConsoleReport`, builds the `report.json` document with
`buildComparisonDocument`, and hands everything to `writeBenchRunArtifacts`. Each child entry calls
`runBenchmarkChildMain` with the library's scenario collector.
[`../../benchmarks/di-inversify`](../../benchmarks/di-inversify) and
[`../../benchmarks/tailwind-variants`](../../benchmarks/tailwind-variants) are the two consumers.

## Documentation

- [`CHANGELOG.md`](./CHANGELOG.md) — release notes for this package.
- [`../benchmark-viewer`](../benchmark-viewer) — the server and browser app that read the JSONL these runs write.
- [`../../benchmarks/di-inversify/BENCH_GUIDE.md`](../../benchmarks/di-inversify/BENCH_GUIDE.md) — the measurement
  standard the suites hold a number to, written against this harness.

## Contributing

See the repository [`CONTRIBUTING.md`](../../CONTRIBUTING.md).

## License

Released under the [MIT License](../../LICENSE).
