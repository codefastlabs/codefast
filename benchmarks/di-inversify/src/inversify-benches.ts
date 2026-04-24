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
import { buildInversifyAsyncScenarios } from "#/scenarios/inversify/async";
import { buildInversifyBootScenarios } from "#/scenarios/inversify/boot";
import { buildInversifyFanOutScenarios } from "#/scenarios/inversify/fan-out";
import { buildInversifyLifecycleScenarios } from "#/scenarios/inversify/lifecycle";
import { buildInversifyMicroScenarios } from "#/scenarios/inversify/micro";
import { buildInversifyRealisticScenarios } from "#/scenarios/inversify/realistic";
import { buildInversifyScaleScenarios } from "#/scenarios/inversify/scale";
import { buildInversifyScopeScenarios } from "#/scenarios/inversify/scope";
import type { AnyScenario } from "#/scenarios/types";

const INVERSIFY_LIBRARY_NAME = "inversify";
const INVERSIFY_SCENARIO_NAME = "inversify";

function collectAllInversifyScenarios(): readonly AnyScenario[] {
  return [
    ...buildInversifyMicroScenarios(),
    ...buildInversifyRealisticScenarios(),
    ...buildInversifyFanOutScenarios(),
    ...buildInversifyAsyncScenarios(),
    ...buildInversifyLifecycleScenarios(),
    ...buildInversifyScopeScenarios(),
    ...buildInversifyScaleScenarios(),
    ...buildInversifyBootScenarios(),
  ];
}

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
