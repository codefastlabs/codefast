#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { runOrderForShape } from "@codefast/benchmark-harness/parent/run-bench-subprocess";
import { resolveDisplayName } from "@codefast/benchmark-harness/shared/config";
import {
  BENCH_RESULTS_DIR_NAME,
  resolvePreferredPortFromEnvironment,
} from "@codefast/benchmark-harness/shared/env-keys";
import { startBenchServer } from "@codefast/benchmark-viewer/server";

import { SCENARIO_BASELINES } from "#/fixtures/scenario-parity";
import { assembleTvComparison } from "#/harness/comparison";
import { CODEFAST_TV, CVA, SERVE_TITLE, TAILWIND_VARIANTS } from "#/harness/config";

await startBenchServer({
  benchResultsDir: join(dirname(fileURLToPath(import.meta.url)), "..", "..", BENCH_RESULTS_DIR_NAME),
  preferredPort: resolvePreferredPortFromEnvironment(3002),
  title: SERVE_TITLE,
  // Each shape's cached, uncached, merged and unmerged rows read against each other on one chart.
  viewDefaults: { overlayGroup: true, useLogScale: true },
  scenarioBaselines: Object.fromEntries(SCENARIO_BASELINES),
  libraries: [
    {
      name: CODEFAST_TV.libraryName,
      displayName: resolveDisplayName(CODEFAST_TV),
      isPrimary: true,
    },
    { name: TAILWIND_VARIANTS.libraryName, displayName: resolveDisplayName(TAILWIND_VARIANTS) },
    { name: CVA.libraryName, displayName: resolveDisplayName(CVA) },
  ],
  deriveReport: (parsed, { runId }) => {
    if (parsed.shape === undefined) {
      return undefined;
    }
    const { markdown, comparisonDocument } = assembleTvComparison(parsed.libraries, {
      runId,
      runOrder: runOrderForShape(parsed.shape.isolated),
      shape: parsed.shape,
    });
    return { markdown, comparisonJson: `${JSON.stringify(comparisonDocument, undefined, 2)}\n` };
  },
});
