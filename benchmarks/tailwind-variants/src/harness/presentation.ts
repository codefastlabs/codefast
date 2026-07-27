import type {
  ComparisonConsoleReportOptions,
  ComparisonMarkdownReportOptions,
} from "@codefast/benchmark-harness/report/comparison";

/**
 * @since 0.3.16-canary.0
 */
export const TAILWIND_VARIANTS_COMPARISON_MARKDOWN: ComparisonMarkdownReportOptions = {
  documentHeading: "# @codefast/tailwind-variants vs tailwind-variants / class-variance-authority — benchmark report",
  sectionHeading: "Comparable scenarios",
  includeEnvironment: true,
  includeSanityFailures: true,
  introLines: [
    "Each library runs in its own subprocess with identical tinybench budgets and shared fixtures.",
    "",
    "One row per scenario `@codefast/tailwind-variants` measures, one throughput column per library, one ratio column per competitor. **class-variance-authority only implements the scenarios with a cva path**, so it reads `—` elsewhere; its win/parity/loss line below counts only the rows it measured.",
    "",
    "cva “with merge” uses `tailwind-merge` after `cva()` — the usual production pairing — not identical to `tv`’s internal merge, but stable across runs.",
    "",
    "`hz/op` is operations per second per logical operation (throughput.mean × batch). The `IQR` column is the interquartile range of per-trial throughput across the trial loop. Per-library `mean ms` and `p99 ms` are in `latest.jsonl`, not this table.",
  ],
};

/**
 * @since 0.3.16-canary.0
 */
export const TAILWIND_VARIANTS_COMPARISON_CONSOLE: ComparisonConsoleReportOptions = {
  sectionHeading: "Comparable scenarios",
  footerHintLine: "Markdown: report.md in the run directory.",
};
