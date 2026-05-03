import type { AnyBenchScenario } from "#/bench-scenario";

/**
 * Runs each scenario's optional `sanity` hook once before measurement.
 * Failures are non-fatal: their IDs are returned so the trial runner can skip them.
 */
export async function runSanityChecks(scenarios: readonly AnyBenchScenario[]): Promise<string[]> {
  const sanityFailures: string[] = [];
  for (const scenario of scenarios) {
    if (scenario.sanity === undefined) {
      continue;
    }
    let ok = false;
    try {
      ok = await scenario.sanity();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[sanity] ${scenario.id}: threw — ${errorMessage}`);
      ok = false;
    }
    if (!ok) {
      sanityFailures.push(scenario.id);
    }
  }
  return sanityFailures;
}
