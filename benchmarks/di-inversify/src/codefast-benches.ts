/**
 * @codefast/di bench subprocess entry point.
 *
 * Responsibilities:
 * - Gather scenarios from every `scenarios/codefast/*.ts` module.
 * - Run pre-bench sanity checks; skip scenarios that fail.
 * - Execute N trials and aggregate per-trial stats.
 * - Emit the resulting `SubprocessPayload` with framing markers so the
 *   parent harness can parse it unambiguously.
 *
 * Must run under `tsconfig.codefast.json` — Stage 3 decorators + emit
 * `Symbol.metadata`. The parent spawns it with `NODE_OPTIONS=--expose-gc
 * --no-warnings NODE_ENV=production`.
 */
import { collectFingerprint } from "#/harness/fingerprint";
import { emitSubprocessPayload } from "#/harness/protocol";
import { runSanityChecks } from "#/harness/sanity";
import { runAllTrials } from "#/harness/trial";
import { buildCodefastDiagnosticScenarios } from "#/scenarios/codefast/diagnostic";
import { buildCodefastFanOutScenarios } from "#/scenarios/codefast/fan-out";
import { buildCodefastMicroScenarios } from "#/scenarios/codefast/micro";
import { buildCodefastRealisticScenarios } from "#/scenarios/codefast/realistic";
import { buildCodefastScopeScenarios } from "#/scenarios/codefast/scope";
import type { AnyScenario } from "#/scenarios/types";

const CODEFAST_LIBRARY_NAME = "@codefast/di";

function collectAllCodefastScenarios(): readonly AnyScenario[] {
  return [
    ...buildCodefastMicroScenarios(),
    ...buildCodefastRealisticScenarios(),
    ...buildCodefastFanOutScenarios(),
    ...buildCodefastScopeScenarios(),
    ...buildCodefastDiagnosticScenarios(),
  ];
}

async function main(): Promise<void> {
  const scenarios = collectAllCodefastScenarios();
  const sanityFailures = runSanityChecks(scenarios);
  const trials = await runAllTrials(scenarios, sanityFailures);

  emitSubprocessPayload({
    fingerprint: collectFingerprint(CODEFAST_LIBRARY_NAME),
    trials,
    sanityFailures,
  });
}

main().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`[${CODEFAST_LIBRARY_NAME}] bench subprocess failed: ${errorMessage}`);
  if (error instanceof Error && error.stack !== undefined) {
    console.error(error.stack);
  }
  process.exit(1);
});
