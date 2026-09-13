#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { runOrderForShape } from "@internal/benchmark-harness/parent/run-bench-subprocess";
import { resolveDisplayName } from "@internal/benchmark-harness/shared/config";
import {
  BENCH_RESULTS_DIR_NAME,
  resolvePreferredPortFromEnvironment,
} from "@internal/benchmark-harness/shared/env-keys";
import { startBenchServer } from "@internal/benchmark-viewer/server";

import { assembleDiComparison } from "#/harness/comparison";
import { BENCH_LIBRARIES, CODEFAST_DI, SERVE_TITLE } from "#/harness/config";
import { collectAllCodefastScenarios } from "#/scenarios/collect-codefast-scenarios";

/** Chip display order; the labels themselves are declared on the scenario definitions. */
const FACET_LABEL_ORDER = [
  "name",
  "tag",
  "scope",
  "plan",
  "optional",
  "alias",
  "resolve-all",
  "singleton",
  "transient",
  "hook",
] as const;

function collectScenarioFacets(): { labels: Array<string>; byScenarioId: Record<string, ReadonlyArray<string>> } {
  const byScenarioId: Record<string, ReadonlyArray<string>> = {};
  const declaredLabels = new Set<string>();
  for (const scenario of collectAllCodefastScenarios()) {
    if (scenario.facets !== undefined && scenario.facets.length > 0) {
      byScenarioId[scenario.id] = scenario.facets;
      for (const label of scenario.facets) {
        declaredLabels.add(label);
      }
    }
  }
  const unordered = [...declaredLabels].filter((label) => !FACET_LABEL_ORDER.includes(label as never));
  if (unordered.length > 0) {
    console.warn(`[bench-serve] facets missing from FACET_LABEL_ORDER (hidden from chips): ${unordered.join(", ")}`);
  }
  return { labels: FACET_LABEL_ORDER.filter((label) => declaredLabels.has(label)), byScenarioId };
}

await startBenchServer({
  benchResultsDir: join(dirname(fileURLToPath(import.meta.url)), "..", "..", BENCH_RESULTS_DIR_NAME),
  preferredPort: resolvePreferredPortFromEnvironment(3001),
  title: SERVE_TITLE,
  libraries: BENCH_LIBRARIES.map((library) => ({
    name: library.libraryName,
    displayName: resolveDisplayName(library),
    isPrimary: library === CODEFAST_DI,
  })),
  // Resolved from the scenario declarations themselves, so a rename cannot detach its facets.
  scenarioFacets: collectScenarioFacets(),
  deriveReport: (parsed, { runId }) => {
    if (parsed.shape === undefined) {
      return undefined;
    }
    const { markdown, comparisonDocument } = assembleDiComparison(parsed.libraries, {
      runId,
      runOrder: runOrderForShape(parsed.shape.isolated),
      shape: parsed.shape,
    });
    return { markdown, comparisonJson: `${JSON.stringify(comparisonDocument, undefined, 2)}\n` };
  },
});
