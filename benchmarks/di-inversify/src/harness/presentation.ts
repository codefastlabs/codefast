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
    "Every inversify container is created with **`{ jitless: false }`**, enabling its codegen resolvers for transient instance/resolved bindings — inversify's fastest documented configuration (the default `jitless: true` is the CSP-safe fallback).",
    "",
    "Rows flagged as excluded from aggregates stay in the table but out of the medians/geomeans: their two sides do incomparable amounts of work per op (`circular-dependency-3` — codefast fails on the third factory entry, inversify re-enters the user factory hundreds of times before its own error).",
    "",
    "One row per scenario `@codefast/di` measures, one throughput column for it, one ratio column per competitor. **awilix and tsyringe implement only the factory/class-binding core subset**, so they read `—` on every scenario outside it; the `Comparable` column below counts only the rows they actually measured.",
    "",
    "Cite the summary, not the rows. `hz/op` is operations per second per logical operation (tinybench `throughput.mean` multiplied by `batch`); a competitor's own throughput is that figure divided by its ratio, and its exact value, along with `mean ms`, `p99 ms` and every per-trial IQR, is in `latest.jsonl`.",
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
