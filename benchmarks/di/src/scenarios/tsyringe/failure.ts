/**
 * tsyringe — failure scenario: resolving an unregistered token fails fast.
 */
import "reflect-metadata";
import { container as tsyringeRootContainer } from "tsyringe";

import { MISCONFIGURED_MISSING_BINDING } from "#/fixtures/scenario-parity";
import type { BenchScenario } from "#/scenarios/types";

const missingToken = Symbol("bench-tsyringe-failure-missing");

function buildMisconfiguredMissingBindingScenario(): BenchScenario {
  const container = tsyringeRootContainer.createChildContainer();

  return {
    ...MISCONFIGURED_MISSING_BINDING,
    what: "resolve an unregistered token and fail fast",
    batch: 1,
    sanity: () => {
      try {
        container.resolve(missingToken);
        return false;
      } catch {
        return true;
      }
    },
    build: () => {
      return () => {
        try {
          container.resolve(missingToken);
          throw new Error("Expected missing registration to throw");
        } catch {
          // Expected failure path.
        }
      };
    },
  };
}

/**
 * Builds tsyringe's failure scenarios.
 *
 * @since 0.8.0
 */
export function buildTsyringeFailureScenarios(): ReadonlyArray<BenchScenario> {
  return [buildMisconfiguredMissingBindingScenario()];
}
