import type {
  ComparisonConsoleReportOptions,
  ComparisonMarkdownReportOptions,
} from "@internal/benchmark-harness/report/comparison";
import { resolveDisplayName } from "@internal/benchmark-harness/shared/config";

import { BENCH_LIBRARIES, VERSUS_LINE } from "#/harness/config";

// Derived from the library configs so a new competitor lands in the intro without a prose edit.
const STRATEGY_LINES = BENCH_LIBRARIES.map((library) => `- **${resolveDisplayName(library)}** — ${library.strategy}`);

/**
 * @since 0.3.16-canary.0
 */
export const TAILWIND_VARIANTS_COMPARISON_MARKDOWN: ComparisonMarkdownReportOptions = {
  documentHeading: `# ${VERSUS_LINE} — benchmark report`,
  sectionHeading: "Comparable scenarios",
  includeEnvironment: true,
  includeSanityFailures: true,
  introLines: [
    "Each library runs in its own subprocess with identical tinybench budgets and shared fixtures, and each pays for a render the way its own design dictates:",
    "",
    ...STRATEGY_LINES,
    "",
    "So every row `@codefast/tailwind-variants` shares with `tailwind-variants` is a cache hit on both sides — the gap is the cost of the hit path, not the presence of a cache — while a `class-variance-authority` cell compares a hit against a full computation.",
    "",
    "One row per scenario `@codefast/tailwind-variants` measures, one throughput column for it, one ratio column per competitor. **class-variance-authority is ported only for the `simple` and `complex` groups** — it has no slots, no extends and no factory — so it reads `—` elsewhere; the `Comparable` column below counts only the rows it measured.",
    "",
    "The rows the summary excludes are controls rather than comparisons: `uncached-*` runs only on the `@codefast/tailwind-variants` side with the resolution cache and the tailwind-merge cache both off, and pairs a with-merge row against a without-merge one so their delta is the merge step itself — `tailwind-variants` exposes no switch to turn its own cache off, so those rows read `—` in every ratio column; `define-only-*` and `first-render-*` price a component definition, and that definition plus its first render, rather than a repeat render — an eager library compiles at definition and a lazy one at first render, so each ratio is shown but stays out of the median and geomean.",
    "",
    "`hz/op` is operations per second per logical operation (throughput.mean × batch); a competitor's own throughput is that figure divided by its ratio, and its exact value, along with `mean ms`, `p99 ms` and every per-trial IQR, is in the run's `observations.jsonl`.",
  ],
};

/**
 * @since 0.3.16-canary.0
 */
export const TAILWIND_VARIANTS_COMPARISON_CONSOLE: ComparisonConsoleReportOptions = {
  sectionHeading: "Comparable scenarios",
  footerHintLine: "Cite the 'Comparable scenarios' table; `pnpm bench:report` derives report.md from the run.",
};
