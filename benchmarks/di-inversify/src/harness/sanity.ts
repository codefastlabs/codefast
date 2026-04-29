import type { AnyScenario } from "#/scenarios/types";

/**
 * Per-scenario sanity assertion. Runs once before tinybench takes ownership
 * of the closure. Returning `false` (or throwing) registers a sanity failure
 * that the parent harness surfaces in the report and treats as non-fatal — the
 * scenario is skipped rather than polluting the table with zero-hz rows.
 */
export async function runSanityChecks(scenarios: readonly AnyScenario[]): Promise<string[]> {
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
