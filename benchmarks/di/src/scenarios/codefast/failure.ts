import { Container, token } from "@codefast/di";

import {
  AMBIGUOUS_MULTI_BINDING,
  CIRCULAR_DEPENDENCY_3,
  MISCONFIGURED_MISSING_BINDING,
} from "#/fixtures/scenario-parity";
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

function buildMisconfiguredMissingBindingScenario(): BenchScenario {
  const missingToken = token<number>("bench-cf-failure-missing-binding");
  const container = Container.create();

  return {
    ...MISCONFIGURED_MISSING_BINDING,
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
    ...CIRCULAR_DEPENDENCY_3,
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
    ...AMBIGUOUS_MULTI_BINDING,
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
