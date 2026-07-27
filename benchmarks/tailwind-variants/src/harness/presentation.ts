import type {
  ComparisonConsoleReportOptions,
  ComparisonMarkdownReportOptions,
} from "@codefast/benchmark-harness/report/comparison";

/**
 * @since 0.3.16-canary.0
 */
export const CODEFAST_VS_TAILWIND_VARIANTS_MARKDOWN: ComparisonMarkdownReportOptions = {
  documentHeading: "# @codefast/tailwind-variants vs tailwind-variants — benchmark report",
  sectionHeading: "Comparable scenarios",
  columnProfile: "full",
  includeEnvironment: true,
  includeSanityFailures: true,
  introLines: [
    "Each library runs in its own subprocess with identical tinybench budgets and shared fixtures.",
    "",
    "`hz/op` is operations per second per logical operation (throughput.mean × batch). The `IQR` column is the interquartile range of per-trial throughput across the trial loop.",
  ],
};

/**
 * @since 0.3.16-canary.0
 */
export const CODEFAST_VS_TAILWIND_VARIANTS_CONSOLE: ComparisonConsoleReportOptions = {
  sectionHeading: "@codefast/tailwind-variants vs tailwind-variants",
  columnProfile: "full",
  footerHintLine: "Markdown: report-vs-tailwind-variants.md in the run directory.",
};

/**
 * @since 0.3.16-canary.0
 */
export const CODEFAST_VS_CVA_MARKDOWN: ComparisonMarkdownReportOptions = {
  documentHeading: "# @codefast/tailwind-variants vs class-variance-authority — benchmark report",
  sectionHeading: "Comparable scenarios",
  columnProfile: "full",
  includeEnvironment: true,
  includeSanityFailures: true,
  introLines: [
    "Only scenarios that include a class-variance-authority path appear here; other benchmark rows exist only in the @codefast/tailwind-variants vs tailwind-variants report.",
    "",
    "cva “with merge” uses `tailwind-merge` after `cva()` — the usual production pairing — not identical to `tv`’s internal merge, but stable across runs.",
  ],
};

/**
 * @since 0.3.16-canary.0
 */
export const CODEFAST_VS_CVA_CONSOLE: ComparisonConsoleReportOptions = {
  sectionHeading: "@codefast/tailwind-variants vs class-variance-authority",
  columnProfile: "full",
  footerHintLine: "Markdown: report-vs-class-variance-authority.md in the run directory.",
};
