import type {
  ComparisonConsoleReportOptions,
  ComparisonMarkdownReportOptions,
} from "@codefast/benchmark-harness/report/comparison";

/**
 * Stable copy for the head-to-head `@codefast/di` vs InversifyJS 8 report.
 * Keeps `run.ts` free of duplicated prose.
 *
 * @since 0.3.16-canary.0
 */
export const DI_INVERSIFY_MARKDOWN: ComparisonMarkdownReportOptions = {
  documentHeading: "# @codefast/di vs InversifyJS 8 — benchmark report",
  sectionHeading: "Comparable scenarios",
  columnProfile: "full",
  includeEnvironment: true,
  includeSanityFailures: true,
  introLines: [
    "Each library runs at its **canonical decorator mode** — inversify with legacy experimental decorators + `reflect-metadata`, @codefast/di with TC39 Stage 3 decorators + `Symbol.metadata`. This measures the shipping experience of each library, not the raw decorator runtimes in isolation.",
    "",
    "Cite these rows when comparing the libraries. `hz/op` is operations per second per logical operation (tinybench `throughput.mean` multiplied by `batch`). The `IQR` column is the interquartile range of the per-trial throughput across the trial loop — treat rows above ~5% as noisy.",
    "",
    "Run with `BENCH_ISOLATE=1` to bench each scenario in its own subprocess, removing cross-scenario inline-cache wear (~30% on async chains in a shared process).",
  ],
};

/**
 * The core subset every library can express, so a wide table stays readable on ratios alone.
 *
 * @since 0.5.0-canary.7
 */
export const DI_NWAY_MARKDOWN: ComparisonMarkdownReportOptions = {
  documentHeading: "# @codefast/di — N-way core-subset comparison",
  sectionHeading: "N-way core subset (di vs inversify vs awilix vs tsyringe)",
  columnProfile: "compact",
  introLines: [
    "The core subset is the set of factory/class-binding scenarios every library supports. `hz/op` is operations per second per logical operation; ratio columns are @codefast/di over each competitor. A `—` means the competitor never measured that scenario.",
  ],
};

/**
 * @since 0.3.16-canary.0
 */
export const DI_INVERSIFY_CONSOLE: ComparisonConsoleReportOptions = {
  sectionHeading: "Comparable scenarios",
  columnProfile: "full",
  footerHintLine: "Cite the 'Comparable scenarios' table.",
};

/**
 * @since 0.5.0-canary.7
 */
export const DI_NWAY_CONSOLE: ComparisonConsoleReportOptions = {
  sectionHeading: "N-way core subset (di vs inversify vs awilix vs tsyringe)",
  columnProfile: "compact",
};
