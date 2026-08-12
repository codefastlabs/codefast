/** Prints this suite's scenario ids as JSON on stdout, measuring nothing. */

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { resolveBenchParentExitCode } from "@codefast/benchmark-harness/parent/resolve-bench-parent-exit-code";
import { runBenchScenarioListingMain } from "@codefast/benchmark-harness/parent/run-bench-listing-main";

import { AWILIX, CODEFAST_DI, INVERSIFY, TSYRINGE } from "#/harness/config";

const packageRootDirectory = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

runBenchScenarioListingMain(packageRootDirectory, [CODEFAST_DI, INVERSIFY, AWILIX, TSYRINGE]).catch(
  (caught: unknown) => {
    const message = caught instanceof Error ? caught.message : String(caught);
    console.error(`\nScenario listing failed: ${message}`);
    process.exitCode = resolveBenchParentExitCode(caught);
  },
);
