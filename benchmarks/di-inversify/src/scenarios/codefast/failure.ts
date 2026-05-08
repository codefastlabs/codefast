import { Container, token } from "@codefast/di";
import type { BenchScenario } from "#/scenarios/types";

interface CircularNodeA {
  readonly value: "a";
}

interface CircularNodeB {
  readonly value: "b";
}

interface CircularNodeC {
  readonly value: "c";
}

const MISCONFIGURED_MISSING_BINDING_WHAT = "resolve a missing binding and fail fast";
const CIRCULAR_DEPENDENCY_THREE_WHAT = "resolve a 3-node circular dependency and fail fast";
const AMBIGUOUS_MULTI_BINDING_WHAT =
  "resolve a single service from ambiguous multi-bindings and fail fast";

function buildMisconfiguredMissingBindingScenario(): BenchScenario {
  const missingToken = token<number>("bench-cf-failure-missing-binding");
  const container = Container.create();

  return {
    id: "misconfigured-missing-binding",
    group: "failure",
    what: MISCONFIGURED_MISSING_BINDING_WHAT,
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
          throw new Error("Expected missing binding to throw");
        } catch {
          // Expected failure-path for benchmark parity.
        }
      };
    },
  };
}

function buildCircularDependencyThreeScenario(): BenchScenario {
  const circularNodeAToken = token<CircularNodeA>("bench-cf-failure-circular-a");
  const circularNodeBToken = token<CircularNodeB>("bench-cf-failure-circular-b");
  const circularNodeCToken = token<CircularNodeC>("bench-cf-failure-circular-c");
  const container = Container.create();

  container
    .bind(circularNodeAToken)
    .toDynamic((resolutionContext) => {
      resolutionContext.resolve(circularNodeBToken);
      return { value: "a" };
    })
    .transient();
  container
    .bind(circularNodeBToken)
    .toDynamic((resolutionContext) => {
      resolutionContext.resolve(circularNodeCToken);
      return { value: "b" };
    })
    .transient();
  container
    .bind(circularNodeCToken)
    .toDynamic((resolutionContext) => {
      resolutionContext.resolve(circularNodeAToken);
      return { value: "c" };
    })
    .transient();

  return {
    id: "circular-dependency-3",
    group: "failure",
    what: CIRCULAR_DEPENDENCY_THREE_WHAT,
    batch: 1,
    sanity: () => {
      try {
        container.resolve(circularNodeAToken);
        return false;
      } catch {
        return true;
      }
    },
    build: () => {
      return () => {
        try {
          container.resolve(circularNodeAToken);
          throw new Error("Expected circular dependency resolution to throw");
        } catch {
          // Expected failure-path for benchmark parity.
        }
      };
    },
  };
}

function buildAmbiguousMultiBindingScenario(): BenchScenario {
  const ambiguousToken = token<string>("bench-cf-failure-ambiguous");
  const container = Container.create();
  container
    .bind(ambiguousToken)
    .toConstantValue("first")
    .when(() => true);
  container
    .bind(ambiguousToken)
    .toConstantValue("second")
    .when(() => true);

  return {
    id: "ambiguous-multi-binding",
    group: "failure",
    what: AMBIGUOUS_MULTI_BINDING_WHAT,
    batch: 1,
    sanity: () => {
      try {
        container.resolve(ambiguousToken);
        return false;
      } catch {
        return true;
      }
    },
    build: () => {
      return () => {
        try {
          container.resolve(ambiguousToken);
          throw new Error("Expected ambiguous multi-binding resolution to throw");
        } catch {
          // Expected failure-path for benchmark parity.
        }
      };
    },
  };
}

/**
 * @since 0.3.16-canary.0
 */
export function buildCodefastFailureScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildMisconfiguredMissingBindingScenario(),
    buildCircularDependencyThreeScenario(),
    buildAmbiguousMultiBindingScenario(),
  ];
}
