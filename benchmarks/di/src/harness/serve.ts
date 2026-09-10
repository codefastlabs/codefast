#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { resolveDisplayName } from "@codefast/benchmark-harness/shared/config";
import {
  BENCH_RESULTS_DIR_NAME,
  resolvePreferredPortFromEnvironment,
} from "@codefast/benchmark-harness/shared/env-keys";
import { startBenchServer } from "@codefast/benchmark-viewer/server";

import { AWILIX, BRANDI, CODEFAST_DI, DITOX, INJECTION_JS, INVERSIFY, SERVE_TITLE, TSYRINGE } from "#/harness/config";
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
  libraries: [
    {
      name: CODEFAST_DI.libraryName,
      displayName: resolveDisplayName(CODEFAST_DI),
      isPrimary: true,
    },
    { name: INVERSIFY.libraryName, displayName: resolveDisplayName(INVERSIFY) },
    { name: AWILIX.libraryName, displayName: resolveDisplayName(AWILIX) },
    { name: TSYRINGE.libraryName, displayName: resolveDisplayName(TSYRINGE) },
    { name: BRANDI.libraryName, displayName: resolveDisplayName(BRANDI) },
    { name: DITOX.libraryName, displayName: resolveDisplayName(DITOX) },
    { name: INJECTION_JS.libraryName, displayName: resolveDisplayName(INJECTION_JS) },
  ],
  // Resolved from the scenario declarations themselves, so a rename cannot detach its facets.
  scenarioFacets: collectScenarioFacets(),
});
