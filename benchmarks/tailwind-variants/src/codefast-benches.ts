/** @codefast/tailwind-variants bench subprocess (see `src/harness/run.ts`). */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectFingerprint } from "@codefast/benchmark-harness/fingerprint";
import { emitSubprocessPayload } from "@codefast/benchmark-harness/protocol";
import { runSanityChecks } from "#/harness/sanity";
import { runAllTrials } from "#/harness/trial";
import { collectAllCodefastScenarios } from "#/scenarios/collect-codefast-scenarios";

const LIBRARY_NAME = "@codefast/tailwind-variants";
const SCENARIO_LOG_NAME = "codefast";
const benchmarkPackageRootDirectory = join(dirname(fileURLToPath(import.meta.url)), "..");

async function main(): Promise<void> {
  console.error(`[bench] subprocess ${SCENARIO_LOG_NAME} started`);
  const scenarios = collectAllCodefastScenarios();
  const sanityFailures = await runSanityChecks(scenarios);
  const trials = await runAllTrials(scenarios, sanityFailures);

  emitSubprocessPayload({
    fingerprint: collectFingerprint(LIBRARY_NAME, benchmarkPackageRootDirectory),
    trials,
    sanityFailures,
  });
  console.error(`[bench] subprocess ${SCENARIO_LOG_NAME} completed`);
}

main().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`[${LIBRARY_NAME}] bench subprocess failed: ${errorMessage}`);
  if (error instanceof Error && error.stack !== undefined) {
    console.error(error.stack);
  }
  process.exit(1);
});
