import type {
  ComparisonConsoleReportOptions,
  ComparisonMarkdownReportOptions,
} from "@internal/benchmark-harness/report/comparison";
import { resolveDisplayName } from "@internal/benchmark-harness/shared/config";

import { BENCH_LIBRARIES, VERSUS_LINE } from "#/harness/config";

// Derived from the library configs so a new competitor lands in the intro without a prose edit.
const RUNTIME_LINES = BENCH_LIBRARIES.map((library) => `- **${resolveDisplayName(library)}** — ${library.runtime}`);

/**
 * Stable copy for the one table comparing `@codefast/di` against every competitor.
 * Keeps `run.ts` free of duplicated prose.
 *
 * @since 0.3.16-canary.0
 */
export const DI_COMPARISON_MARKDOWN: ComparisonMarkdownReportOptions = {
  documentHeading: `# ${VERSUS_LINE} — benchmark report`,
  sectionHeading: "Comparable scenarios",
  includeEnvironment: true,
  includeSanityFailures: true,
  introLines: [
    "Each library runs in its **canonical runtime mode** — the wiring its own documentation leads with — so the table measures the shipping experience of each container, not one decorator runtime forced onto all of them:",
    "",
    ...RUNTIME_LINES,
    "",
    "Every inversify container is created with **`{ jitless: false }`**, enabling its codegen resolvers for transient instance/resolved bindings — inversify's fastest documented configuration (the default `jitless: true` is the CSP-safe fallback).",
    "",
    "Rows flagged as excluded from aggregates stay in the table but out of the medians/geomeans: their two sides do incomparable amounts of work per op (`circular-dependency-3` — codefast fails on the third factory entry, inversify re-enters the user factory hundreds of times before its own error).",
    "",
    "One row per scenario `@codefast/di` measures, one throughput column for it, one ratio column per competitor. **No competitor runs every row.** Each implements the shared descriptors its own idiom expresses honestly: inversify nearly all of them; awilix, tsyringe, brandi and ditox the factory/class core plus whichever scope, lifecycle, module, multi-binding and async rows their API has a native form for; injection-js only the singleton-friendly rows, since Angular's `ReflectiveInjector` caches every provider per injector. The `slot-selection` and `resolution` groups are `@codefast/di` instrumentation with no head-to-head pair. A competitor reads `—` on a row it does not measure, and the `Comparable` column counts only the rows it actually ran.",
    "",
    "Cite the summary, not the rows. `hz/op` is operations per second per logical operation (tinybench `throughput.mean` multiplied by `batch`); a competitor's own throughput is that figure divided by its ratio, and its exact value, along with `mean ms`, `p99 ms` and every per-trial IQR, is in the run's `observations.jsonl`.",
    "",
    "Run with `BENCH_ISOLATE=true` to bench each scenario in its own subprocess, removing cross-scenario inline-cache wear (~30% on async chains in a shared process).",
  ],
};

/**
 * @since 0.3.16-canary.0
 */
export const DI_COMPARISON_CONSOLE: ComparisonConsoleReportOptions = {
  sectionHeading: "Comparable scenarios",
  footerHintLine: "Cite the 'Comparable scenarios' table.",
};
