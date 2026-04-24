/**
 * InversifyJS 8 bench subprocess entry point.
 *
 * Mirror of `codefast-benches.ts`. Must run under `tsconfig.inversify.json`
 * — legacy experimental decorators + `reflect-metadata`.
 */
import "reflect-metadata";
import { collectFingerprint } from "#/harness/fingerprint";
import { emitSubprocessPayload } from "#/harness/protocol";
import { runSanityChecks } from "#/harness/sanity";
import { runAllTrials } from "#/harness/trial";
import { collectAllInversifyScenarios } from "#/scenarios/collect-inversify-scenarios";

const INVERSIFY_LIBRARY_NAME = "inversify";
const INVERSIFY_SCENARIO_NAME = "inversify";

async function main(): Promise<void> {
  console.log(`Scenario ${INVERSIFY_SCENARIO_NAME} started`);
  const scenarios = collectAllInversifyScenarios();
  const sanityFailures = await runSanityChecks(scenarios);
  const trials = await runAllTrials(scenarios, sanityFailures);

  emitSubprocessPayload({
    fingerprint: collectFingerprint(INVERSIFY_LIBRARY_NAME),
    trials,
    sanityFailures,
  });
  console.log(`Scenario ${INVERSIFY_SCENARIO_NAME} completed`);
}

main().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`[${INVERSIFY_LIBRARY_NAME}] bench subprocess failed: ${errorMessage}`);
  if (error instanceof Error && error.stack !== undefined) {
    console.error(error.stack);
  }
  process.exit(1);
});
