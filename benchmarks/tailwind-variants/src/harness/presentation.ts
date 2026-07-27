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
    "One row per scenario `@codefast/tailwind-variants` measures, one throughput column for it, one ratio column per competitor. **class-variance-authority only implements the scenarios with a cva path**, so it reads `—` elsewhere; the `Comparable` column below counts only the rows it measured.",
    "",
    "cva “with merge” uses `tailwind-merge` after `cva()` — the usual production pairing — not identical to `tv`’s internal merge, but stable across runs.",
    "",
    "`hz/op` is operations per second per logical operation (throughput.mean × batch); a competitor's own throughput is that figure divided by its ratio, and its exact value, along with `mean ms`, `p99 ms` and every per-trial IQR, is in `latest.jsonl`.",
  ],
};

/**
 * @since 0.3.16-canary.0
 */
export const TAILWIND_VARIANTS_COMPARISON_CONSOLE: ComparisonConsoleReportOptions = {
  sectionHeading: "Comparable scenarios",
  footerHintLine: "Markdown: report.md in the run directory.",
};
