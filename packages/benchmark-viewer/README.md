# @codefast/benchmark-viewer

React SSR server for browsing benchmark run history produced by the `benchmarks/*` suites.

> **Private package.** Not published to npm; consumed only by the benchmark suites in this repository.

## What It Provides

- `startBenchServer` / `createBenchServer` — an HTTP server that server-renders the viewer app with the run history embedded in the page payload (`buildEmbeddedPayload`, `listRawRuns`).
- `app/*` — the viewer React app: run finder, comparison charts, KPI cards, and a command palette for jumping between scenarios.
- `findAvailablePort` — picks a free port so suites can launch the viewer without configuration.

The viewer reads the JSONL observation files written by [`@codefast/benchmark-harness`](https://github.com/codefastlabs/codefast/tree/main/packages/benchmark-harness) reports and charts library-vs-library results across runs.

## Usage

From the repo root:

```bash
pnpm bench:serve
```

This starts the viewer for the recorded runs of the suites under [`benchmarks/`](https://github.com/codefastlabs/codefast/tree/main/benchmarks).

## License

[MIT](https://github.com/codefastlabs/codefast/blob/main/LICENSE)
