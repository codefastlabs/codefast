import type {
  ComparisonConsoleReportOptions,
  ComparisonMarkdownReportOptions,
} from "@codefast/benchmark-harness/report/comparison";

/**
 * Stable copy for the one table comparing `@codefast/di` against every competitor.
 * Keeps `run.ts` free of duplicated prose.
 *
 * @since 0.3.16-canary.0
 */
export const DI_COMPARISON_MARKDOWN: ComparisonMarkdownReportOptions = {
  documentHeading: "# @codefast/di vs inversify / awilix / tsyringe — benchmark report",
  sectionHeading: "Comparable scenarios",
  includeEnvironment: true,
  includeSanityFailures: true,
  introLines: [
    "Each library runs at its **canonical decorator mode** — inversify with legacy experimental decorators + `reflect-metadata`, @codefast/di with TC39 Stage 3 decorators + `Symbol.metadata`. This measures the shipping experience of each library, not the raw decorator runtimes in isolation.",
    "",
    "One row per scenario `@codefast/di` measures, one throughput column per library, one ratio column per competitor. **awilix and tsyringe implement only the factory/class-binding core subset**, so they read `—` on every scenario outside it; their win/parity/loss lines below count only the rows they actually measured.",
    "",
    "Cite these rows when comparing the libraries. `hz/op` is operations per second per logical operation (tinybench `throughput.mean` multiplied by `batch`). The `IQR` column is the interquartile range of the per-trial throughput across the trial loop — treat rows above ~5% as noisy. Per-library `mean ms` and `p99 ms` are in `latest.jsonl`, not this table.",
    "",
    "Run with `BENCH_ISOLATE=1` to bench each scenario in its own subprocess, removing cross-scenario inline-cache wear (~30% on async chains in a shared process).",
  ],
};

/**
 * @since 0.3.16-canary.0
 */
export const DI_COMPARISON_CONSOLE: ComparisonConsoleReportOptions = {
  sectionHeading: "Comparable scenarios",
  footerHintLine: "Cite the 'Comparable scenarios' table.",
};
