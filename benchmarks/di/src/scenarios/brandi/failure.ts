/**
 * Brandi — failure scenario: `get()` on an unbound token fails fast.
 */
import { createContainer, token } from "brandi";

import { MISCONFIGURED_MISSING_BINDING } from "#/fixtures/scenario-parity";
import type { BenchScenario } from "#/scenarios/types";

const MISSING = token<number>("bench-brandi-failure-missing");

function buildMisconfiguredMissingBindingScenario(): BenchScenario {
  const container = createContainer();

  return {
    ...MISCONFIGURED_MISSING_BINDING,
    what: "get() an unbound token and fail fast",
    batch: 1,
    sanity: () => {
      try {
        container.get(MISSING);
        return false;
      } catch {
        return true;
      }
    },
    build: () => {
      return () => {
        try {
          container.get(MISSING);
          throw new Error("Expected missing binding to throw");
        } catch {
          // Expected failure path.
        }
      };
    },
  };
}

/**
 * Builds brandi's failure scenarios.
 */
export function buildBrandiFailureScenarios(): ReadonlyArray<BenchScenario> {
  return [buildMisconfiguredMissingBindingScenario()];
}
