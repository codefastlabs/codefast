/**
 * Ditox — failure scenario: `resolve()` on an unbound token fails fast with a `ResolverError`.
 */
import { createContainer, token } from "ditox";

import { MISCONFIGURED_MISSING_BINDING } from "#/fixtures/scenario-parity";
import type { BenchScenario } from "#/scenarios/types";

const MISSING = token<number>("bench-ditox-failure-missing");

function buildMisconfiguredMissingBindingScenario(): BenchScenario {
  const container = createContainer();

  return {
    ...MISCONFIGURED_MISSING_BINDING,
    what: "resolve() an unbound token and fail fast",
    batch: 1,
    sanity: () => {
      try {
        container.resolve(MISSING);
        return false;
      } catch {
        return true;
      }
    },
    build: () => {
      return () => {
        try {
          container.resolve(MISSING);
          throw new Error("Expected missing binding to throw");
        } catch {
          // Expected failure path.
        }
      };
    },
  };
}

/**
 * Builds ditox's failure scenarios.
 */
export function buildDitoxFailureScenarios(): ReadonlyArray<BenchScenario> {
  return [buildMisconfiguredMissingBindingScenario()];
}
