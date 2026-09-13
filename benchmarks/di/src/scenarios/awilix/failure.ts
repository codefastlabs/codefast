/**
 * Awilix — failure scenarios: a missing registration and a three-node cycle, both of which awilix
 * reports with an `AwilixResolutionError`.
 */
import { asFunction, createContainer } from "awilix";

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

function buildMisconfiguredMissingBindingScenario(): BenchScenario {
  const container = createContainer();

  return {
    ...MISCONFIGURED_MISSING_BINDING,
    what: "resolve an unregistered name and fail fast",
    batch: 1,
    sanity: () => failsFast(() => container.resolve("missing")),
    build: () => {
      return () => {
        if (!failsFast(() => container.resolve("missing"))) {
          throw new Error("Expected missing registration to throw");
        }
      };
    },
  };
}

interface CircularCradle {
  readonly a: { readonly value: "a" };
  readonly b: { readonly value: "b" };
  readonly c: { readonly value: "c" };
}

function buildCircularDependencyThreeScenario(): BenchScenario {
  const container = createContainer<CircularCradle>();
  container.register({
    a: asFunction(({ b }: CircularCradle) => {
      void b;
      return { value: "a" as const };
    }).transient(),
    b: asFunction(({ c }: CircularCradle) => {
      void c;
      return { value: "b" as const };
    }).transient(),
    c: asFunction(({ a }: CircularCradle) => {
      void a;
      return { value: "c" as const };
    }).transient(),
  });

  return {
    ...CIRCULAR_DEPENDENCY_3,
    what: "resolve a 3-node circular dependency through the cradle and fail fast (row only — sides do incomparable work)",
    batch: 1,
    sanity: () => failsFast(() => container.resolve("a")),
    build: () => {
      return () => {
        if (!failsFast(() => container.resolve("a"))) {
          throw new Error("Expected circular dependency resolution to throw");
        }
      };
    },
  };
}

/**
 * Builds Awilix's failure scenarios.
 */
export function buildAwilixFailureScenarios(): ReadonlyArray<BenchScenario> {
  return [buildMisconfiguredMissingBindingScenario(), buildCircularDependencyThreeScenario()];
}
