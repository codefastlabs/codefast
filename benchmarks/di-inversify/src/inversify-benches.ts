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
import { buildInversifyDiagnosticScenarios } from "#/scenarios/inversify/diagnostic";
import { buildInversifyFanOutScenarios } from "#/scenarios/inversify/fan-out";
import { buildInversifyMicroScenarios } from "#/scenarios/inversify/micro";
import { buildInversifyRealisticScenarios } from "#/scenarios/inversify/realistic";
import { buildInversifyScopeScenarios } from "#/scenarios/inversify/scope";
import type { AnyScenario } from "#/scenarios/types";

const INVERSIFY_LIBRARY_NAME = "inversify";

function collectAllInversifyScenarios(): readonly AnyScenario[] {
  return [
    ...buildInversifyMicroScenarios(),
    ...buildInversifyRealisticScenarios(),
    ...buildInversifyFanOutScenarios(),
    ...buildInversifyScopeScenarios(),
    ...buildInversifyDiagnosticScenarios(),
  ];
}

async function main(): Promise<void> {
  const scenarios = collectAllInversifyScenarios();
  const sanityFailures = runSanityChecks(scenarios);
  const trials = await runAllTrials(scenarios, sanityFailures);

  emitSubprocessPayload({
    fingerprint: collectFingerprint(INVERSIFY_LIBRARY_NAME),
    trials,
    sanityFailures,
  });
}

main().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`[${INVERSIFY_LIBRARY_NAME}] bench subprocess failed: ${errorMessage}`);
  if (error instanceof Error && error.stack !== undefined) {
    console.error(error.stack);
  }
  process.exit(1);
});
