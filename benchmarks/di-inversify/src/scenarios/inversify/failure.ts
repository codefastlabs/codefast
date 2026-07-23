import "reflect-metadata";
import { Container } from "inversify";
import type { ServiceIdentifier } from "inversify";

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
  const missingIdentifier = Symbol("bench-inv-failure-missing-binding");
  const container = new Container();

  return {
    ...MISCONFIGURED_MISSING_BINDING,
    batch: 1,
    sanity: () => {
      try {
        container.get<number>(missingIdentifier);
        return false;
      } catch {
        return true;
      }
    },
    build: () => {
      return () => {
        try {
          container.get<number>(missingIdentifier);
          throw new Error("Expected missing binding to throw");
        } catch {
          // Expected failure-path for benchmark parity.
        }
      };
    },
  };
}

function buildCircularDependencyThreeScenario(): BenchScenario {
  const circularNodeAIdentifier = Symbol("bench-inv-failure-circular-a");
  const circularNodeBIdentifier = Symbol("bench-inv-failure-circular-b");
  const circularNodeCIdentifier = Symbol("bench-inv-failure-circular-c");
  const container = new Container();

  container
    .bind<CircularNodeA>(circularNodeAIdentifier)
    .toDynamicValue((resolutionContext) => {
      resolutionContext.get<CircularNodeB>(circularNodeBIdentifier);
      return { value: "a" };
    })
    .inTransientScope();
  container
    .bind<CircularNodeB>(circularNodeBIdentifier)
    .toDynamicValue((resolutionContext) => {
      resolutionContext.get<CircularNodeC>(circularNodeCIdentifier);
      return { value: "b" };
    })
    .inTransientScope();
  container
    .bind<CircularNodeC>(circularNodeCIdentifier)
    .toDynamicValue((resolutionContext) => {
      resolutionContext.get<CircularNodeA>(circularNodeAIdentifier);
      return { value: "c" };
    })
    .inTransientScope();

  return {
    ...CIRCULAR_DEPENDENCY_3,
    batch: 1,
    sanity: () => {
      try {
        container.get<CircularNodeA>(circularNodeAIdentifier);
        return false;
      } catch {
        return true;
      }
    },
    build: () => {
      return () => {
        try {
          container.get<CircularNodeA>(circularNodeAIdentifier);
          throw new Error("Expected circular dependency resolution to throw");
        } catch {
          // Expected failure-path for benchmark parity.
        }
      };
    },
  };
}

function buildAmbiguousMultiBindingScenario(): BenchScenario {
  const ambiguousIdentifier = Symbol("bench-inv-failure-ambiguous") as ServiceIdentifier<string>;
  const container = new Container();
  container.bind<string>(ambiguousIdentifier).toConstantValue("first");
  container.bind<string>(ambiguousIdentifier).toConstantValue("second");

  return {
    ...AMBIGUOUS_MULTI_BINDING,
    batch: 1,
    sanity: () => {
      try {
        container.get<string>(ambiguousIdentifier);
        return false;
      } catch {
        return true;
      }
    },
    build: () => {
      return () => {
        try {
          container.get<string>(ambiguousIdentifier);
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
export function buildInversifyFailureScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildMisconfiguredMissingBindingScenario(),
    buildCircularDependencyThreeScenario(),
    buildAmbiguousMultiBindingScenario(),
  ];
}
