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
    "One row per scenario `@codefast/tailwind-variants` measures, one throughput column for it, one ratio column per competitor. **class-variance-authority is ported only for the `simple` and `complex` groups**, so it reads `—` elsewhere; the `Comparable` column below counts only the rows it measured.",
    "",
    "Both `@codefast/tailwind-variants` and `tailwind-variants` cache resolutions per selection, so every row they share is a cache hit on both sides — the gap is the cost of the hit path, not the presence of a cache. `class-variance-authority` keeps no result cache, so its cells compare a hit against a full computation. The rows the summary excludes are controls rather than comparisons: `uncached-*` runs only on the `@codefast/tailwind-variants` side with the resolution cache and the tailwind-merge cache both off, and pairs a with-merge row against a without-merge one so their delta is the merge step itself — `tailwind-variants` exposes no switch to turn its own cache off, so those rows read `—` in every ratio column; `construct-*` measures cost per component definition rather than per render, so its ratio is shown but stays out of the median and geomean; and the cva rows read `—` wherever cva has no port.",
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
