/**
 * injection-js — failure scenarios: a missing provider and a three-node factory cycle, which the
 * injector reports with a `CyclicDependencyError`.
 */
import "reflect-metadata";
import { InjectionToken, ReflectiveInjector } from "injection-js";

import { CIRCULAR_DEPENDENCY_3, MISCONFIGURED_MISSING_BINDING } from "#/fixtures/scenario-parity";
import type { BenchScenario } from "#/scenarios/types";

function failsFast(attempt: () => unknown): boolean {
  try {
    attempt();
    return false;
  } catch {
    return true;
  }
}

const missingToken = new InjectionToken<number>("bench-injection-js-failure-missing");

function buildMisconfiguredMissingBindingScenario(): BenchScenario {
  const injector = ReflectiveInjector.resolveAndCreate([]);

  return {
    ...MISCONFIGURED_MISSING_BINDING,
    what: "get() a token no provider supplies and fail fast",
    batch: 1,
    sanity: () => failsFast(() => injector.get(missingToken)),
    build: () => {
      return () => {
        if (!failsFast(() => injector.get(missingToken))) {
          throw new Error("Expected missing provider to throw");
        }
      };
    },
  };
}

const nodeA = new InjectionToken<{ value: "a" }>("bench-injection-js-circular-a");
const nodeB = new InjectionToken<{ value: "b" }>("bench-injection-js-circular-b");
const nodeC = new InjectionToken<{ value: "c" }>("bench-injection-js-circular-c");

function buildCircularDependencyThreeScenario(): BenchScenario {
  const injector = ReflectiveInjector.resolveAndCreate([
    { provide: nodeA, useFactory: () => ({ value: "a" }), deps: [nodeB] },
    { provide: nodeB, useFactory: () => ({ value: "b" }), deps: [nodeC] },
    { provide: nodeC, useFactory: () => ({ value: "c" }), deps: [nodeA] },
  ]);

  return {
    ...CIRCULAR_DEPENDENCY_3,
    what: "get() a 3-node circular factory dependency and fail fast (row only — sides do incomparable work)",
    batch: 1,
    sanity: () => failsFast(() => injector.get(nodeA)),
    build: () => {
      return () => {
        if (!failsFast(() => injector.get(nodeA))) {
          throw new Error("Expected circular dependency resolution to throw");
        }
      };
    },
  };
}

/**
 * Builds injection-js's failure scenarios.
 *
 * @since 0.8.0
 */
export function buildInjectionJsFailureScenarios(): ReadonlyArray<BenchScenario> {
  return [buildMisconfiguredMissingBindingScenario(), buildCircularDependencyThreeScenario()];
}
