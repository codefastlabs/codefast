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
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectFingerprint } from "@codefast/benchmark-harness/fingerprint";
import { emitSubprocessPayload } from "@codefast/benchmark-harness/protocol";
import { runSanityChecks } from "#/harness/sanity";
import { runAllTrials } from "#/harness/trial";
import { collectAllCodefastScenarios } from "#/scenarios/collect-codefast-scenarios";

const CODEFAST_LIBRARY_NAME = "@codefast/di";
const CODEFAST_SCENARIO_NAME = "codefast";
const benchmarkPackageRootDirectory = join(dirname(fileURLToPath(import.meta.url)), "..");

async function main(): Promise<void> {
  console.log(`Scenario ${CODEFAST_SCENARIO_NAME} started`);
  const scenarios = collectAllCodefastScenarios();
  const sanityFailures = await runSanityChecks(scenarios);
  const trials = await runAllTrials(scenarios, sanityFailures);

  emitSubprocessPayload({
    fingerprint: collectFingerprint(CODEFAST_LIBRARY_NAME, benchmarkPackageRootDirectory),
    trials,
    sanityFailures,
  });
  console.log(`Scenario ${CODEFAST_SCENARIO_NAME} completed`);
}

main().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`[${CODEFAST_LIBRARY_NAME}] bench subprocess failed: ${errorMessage}`);
  if (error instanceof Error && error.stack !== undefined) {
    console.error(error.stack);
  }
  process.exit(1);
});
