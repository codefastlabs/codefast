# @codefast/benchmark-viewer

A React SSR server and browser app for browsing the run history the `benchmarks/*` suites write.

> **Private workspace package.** Never published to npm. It is consumed only by the benchmark suites in this repository
> through `workspace:*`.

- **Reads what the harness writes.** The server reads each run's `observations.jsonl` from a suite's `bench-results/`
  directory and charts library-vs-library results across runs.
- **Zero configuration to launch.** It binds the first free loopback port at or above the one a suite prefers, so
  several suites can serve at once.
- **Fresh without restarts.** The payload is cached in memory and invalidated when a new run lands in the results
  directory.

## What it exports

The root export (and the `./server`, `./server/http`, `./server/payload`, `./server/port`, `./server/render`, `./types`
and `./constants` subpaths) provide:

- `startBenchServer(options)` — creates the server and binds it to the first free loopback port at or above
  `options.preferredPort`, printing the URL it chose.
- `createBenchServer(options)` — the underlying Node `http.Server`, for callers that manage listening themselves.
- `buildEmbeddedPayload` and `listRawRuns` — read the newest run directories' JSONL lines (up to the run cap) and turn
  them into the `EmbeddedViewerPayload` the page embeds.
- `findAvailablePort(preferred)` — the port probe `startBenchServer` uses.
- The payload types (`EmbeddedRun`, `EmbeddedScenarioSeries`, `EmbeddedViewerPayload`, …) and `DEFAULT_MAX_RUNS`.

`BenchServerOptions` names the results directory (`benchResultsDir`), the libraries to track (`libraries`, one of them
`isPrimary` for ratio calculations), an optional page `title`, a `maxRuns` cap on the runs embedded in the initial page
(older runs load on demand), and optional `scenarioFacets` — feature labels a suite resolves from its own scenario
declarations and the viewer renders as filter chips. `StartBenchServerOptions` adds `preferredPort`.

## The browser app

`src/app/` is a Vite-bundled React app that the server renders on the first request and hydrates in the browser. It
shows a KPI grid and a comparison chart (Chart.js with zoom) for the selected scenario, a metrics panel and a per-run
snapshot table, controls for the run range and libraries plotted, and a command palette for jumping between scenarios.
The current view is mirrored into the URL hash, so a chart state can be shared as a link. An **Overlay group** toggle
draws every row of the selected scenario's group on one chart — a colour family per library as everywhere else, with a
shade, a dash pattern and a marker shape per row, the selected row at full weight and the others receding with sparse
markers — so the configurations of one workload read against each other. Under the chart a legend table lists each row
with its newest value per library and its ratio to the selected row; clicking a row selects it, its checkbox hides it,
and hovering it lifts its lines. Tooltips list lines fastest first with each line's ratio to the selected row. A
**Relative to first run** toggle plots every line as a percentage of its own first plotted run, so lines of any scale
share one axis, and dashed rules mark the runs where a row's definition or the primary library's version changed. Older
runs are rescaled to the newest run's `batch`, so a suite changing how many operations one timed iteration performs does
not read as a jump in throughput. A suite can open with the overlay and the log axis on through the server's
`viewDefaults` option.

The package builds in two lanes: plain `tsc` for the Node server, and `vite build` for the browser entry
(`src/app/entry.tsx`) into `dist/app/`.

## Usage

From the repo root:

```bash
pnpm bench:serve          # every suite's viewer
pnpm di:bench:serve       # only the DI suite's viewer
```

`BENCH_PORT=<n>` sets the preferred port; when it is unset, a generic `PORT` set by the launcher is honoured before the
suite's default, so a launcher that assigns a free port finds the viewer there. Each suite's `src/harness/serve.ts` is
the caller: it points `startBenchServer` at its own `bench-results/` directory and declares its libraries and scenario
facets.

## Documentation

- [`CHANGELOG.md`](./CHANGELOG.md) — release notes for this package.
- [`../benchmark-harness`](../benchmark-harness) — the harness that writes the `observations.jsonl` files this viewer
  reads.

## Contributing

See the repository [`CONTRIBUTING.md`](../../CONTRIBUTING.md).

## License

Released under the [MIT License](../../LICENSE).
