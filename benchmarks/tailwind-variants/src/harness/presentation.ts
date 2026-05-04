import type {
  TwoWayConsoleColumnLabels,
  TwoWayMarkdownReportOptions,
} from "@codefast/benchmark-harness";
import { CODEFAST_TV, CVA, TAILWIND_VARIANTS } from "#/harness/config";

export const CODEFAST_VS_TAILWIND_VARIANTS_MARKDOWN = {
  documentHeading: "# @codefast/tailwind-variants vs tailwind-variants — benchmark report",
  columnTitles: {
    leftThroughput: "@codefast/tailwind-variants hz/op",
    rightThroughput: "tailwind-variants hz/op",
    ratioHeading: "@codefast/tailwind-variants / tailwind-variants",
    leftMeanMs: "@codefast/tailwind-variants mean ms",
    rightMeanMs: "tailwind-variants mean ms",
    leftP99Ms: "@codefast/tailwind-variants p99 ms",
    rightP99Ms: "tailwind-variants p99 ms",
    iqrCombinedHeading: "IQR (cf / tv)",
  },
  comparableScenarioIntroLines: [
    "Each library runs in its own subprocess with identical tinybench budgets and shared fixtures.",
    "",
    "`hz/op` is operations per second per logical operation (throughput.mean × batch). `IQR (cf / tv)` is the interquartile range of per-trial throughput across the trial loop.",
  ],
  fingerprintLibraryVersionLabels: {
    left: CODEFAST_TV.libraryName,
    right: TAILWIND_VARIANTS.libraryName,
  },
  sanityBulletMarkdownLabels: {
    left: "**@codefast/tailwind-variants**",
    right: "**tailwind-variants**",
  },
} as const satisfies TwoWayMarkdownReportOptions;

export const CODEFAST_VS_TAILWIND_VARIANTS_CONSOLE: TwoWayConsoleColumnLabels = {
  sectionHeading: "@codefast/tailwind-variants vs tailwind-variants",
  leftThroughputHeader: "cf tv hz/op",
  rightThroughputHeader: "tv tv hz/op",
  ratioHeader: "cf/tv",
  leftMeanHeader: "cf mean ms",
  rightMeanHeader: "tv mean ms",
  leftP99Header: "cf p99 ms",
  rightP99Header: "tv p99 ms",
};

export const CODEFAST_VS_CVA_MARKDOWN = {
  documentHeading: "# @codefast/tailwind-variants vs class-variance-authority — benchmark report",
  columnTitles: {
    leftThroughput: "@codefast/tailwind-variants hz/op",
    rightThroughput: "class-variance-authority hz/op",
    ratioHeading: "@codefast/tailwind-variants / cva",
    leftMeanMs: "@codefast/tailwind-variants mean ms",
    rightMeanMs: "class-variance-authority mean ms",
    leftP99Ms: "@codefast/tailwind-variants p99 ms",
    rightP99Ms: "class-variance-authority p99 ms",
    iqrCombinedHeading: "IQR (cf / cva)",
  },
  comparableScenarioIntroLines: [
    "Only scenarios that include a class-variance-authority path appear here; other benchmark rows exist only in the @codefast/tailwind-variants vs tailwind-variants report.",
    "",
    "cva “with merge” uses `tailwind-merge` after `cva()` — the usual production pairing — not identical to `tv`’s internal merge, but stable across runs.",
  ],
  fingerprintLibraryVersionLabels: {
    left: CODEFAST_TV.libraryName,
    right: CVA.libraryName,
  },
  sanityBulletMarkdownLabels: {
    left: "**@codefast/tailwind-variants**",
    right: "**class-variance-authority**",
  },
} as const satisfies TwoWayMarkdownReportOptions;

export const CODEFAST_VS_CVA_CONSOLE: TwoWayConsoleColumnLabels = {
  sectionHeading: "@codefast/tailwind-variants vs class-variance-authority",
  leftThroughputHeader: "cf tv hz/op",
  rightThroughputHeader: "cva hz/op",
  ratioHeader: "cf/cva",
  leftMeanHeader: "cf mean ms",
  rightMeanHeader: "cva mean ms",
  leftP99Header: "cf p99 ms",
  rightP99Header: "cva p99 ms",
};
