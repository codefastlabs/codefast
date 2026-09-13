/** Prints this suite's scenario ids as JSON on stdout, measuring nothing. */

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { resolveBenchParentExitCode } from "@internal/benchmark-harness/parent/resolve-bench-parent-exit-code";
import { runBenchScenarioListingMain } from "@internal/benchmark-harness/parent/run-bench-listing-main";

import { BENCH_LIBRARIES } from "#/harness/config";

const packageRootDirectory = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

runBenchScenarioListingMain(packageRootDirectory, BENCH_LIBRARIES).catch((caught: unknown) => {
  const message = caught instanceof Error ? caught.message : String(caught);
  console.error(`\nScenario listing failed: ${message}`);
  process.exitCode = resolveBenchParentExitCode(caught);
});
