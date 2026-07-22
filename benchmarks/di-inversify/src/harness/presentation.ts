import type {
  TwoWayConsoleColumnLabels,
  TwoWayMarkdownReportOptions,
} from "@codefast/benchmark-harness/report/two-way";

import { CODEFAST_DI, INVERSIFY } from "#/harness/config";

/**
 * Stable copy for Markdown / console output for `@codefast/di` vs InversifyJS 8.
 * Keeps `run.ts` free of duplicated prose.
 *
 * @since 0.3.16-canary.0
 */
export const DI_INVERSIFY_MARKDOWN = {
  documentHeading: "# @codefast/di vs InversifyJS 8 — benchmark report",
  columnTitles: {
    leftThroughput: "codefast hz/op",
    rightThroughput: "inversify hz/op",
    ratioHeading: "codefast / inversify",
    leftMeanMs: "codefast mean ms",
    rightMeanMs: "inversify mean ms",
    leftP99Ms: "codefast p99 ms",
    rightP99Ms: "inversify p99 ms",
    iqrCombinedHeading: "IQR (cf / inv)",
  },
  comparableScenarioIntroLines: [
    "Each library runs at its **canonical decorator mode** — inversify with legacy experimental decorators + `reflect-metadata`, @codefast/di with TC39 Stage 3 decorators + `Symbol.metadata`. This measures the shipping experience of each library, not the raw decorator runtimes in isolation.",
    "",
    "Cite these rows when comparing the libraries. `hz/op` is operations per second per logical operation (tinybench `throughput.mean` multiplied by `batch`). `IQR (cf / inv)` is the interquartile range of the per-trial throughput across the trial loop — treat rows above ~5% as noisy.",
    "",
    "Rows in the `baseline` group run **no DI library at all** — both children execute identical code. They calibrate the two processes against each other and give a runtime floor to subtract from same-shape rows (V8 promise machinery dominates sub-µs async rows). Run with `BENCH_ISOLATE=1` to bench each scenario in its own subprocess, removing cross-scenario inline-cache wear (~30% on async chains in a shared process).",
  ],
  fingerprintLibraryVersionLabels: {
    left: CODEFAST_DI.libraryName,
    right: INVERSIFY.libraryName,
  },
  sanityBulletMarkdownLabels: {
    left: "**@codefast/di**",
    right: "**inversify**",
  },
} as const satisfies TwoWayMarkdownReportOptions;

/**
 * @since 0.3.16-canary.0
 */
export const DI_INVERSIFY_CONSOLE: TwoWayConsoleColumnLabels = {
  sectionHeading: "Comparable scenarios",
  leftThroughputHeader: "codefast hz/op",
  rightThroughputHeader: "inversify hz/op",
  ratioHeader: "cf/inv",
  leftMeanHeader: "cf mean ms",
  rightMeanHeader: "inv mean ms",
  leftP99Header: "cf p99 ms",
  rightP99Header: "inv p99 ms",
};
