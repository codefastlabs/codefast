/**
 * tsyringe — the cold path, unbundled from a resolve: a fresh child of the global root (tsyringe's
 * only way to make a container), an empty child of a warm parent, and many transient factory
 * registrations with no resolve.
 */
import "reflect-metadata";
import type { DependencyContainer } from "tsyringe";
import { container as tsyringeRootContainer } from "tsyringe";

import {
  BIND_128_PLAIN,
  BIND_TOKEN_COUNT,
  CONTAINER_CREATE_BATCH,
  CONTAINER_CREATE_EMPTY,
  CREATE_CHILD_EMPTY,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

interface BoundValue {
  readonly id: number;
}

const bindTokens = Array.from({ length: BIND_TOKEN_COUNT }, (_value, index) =>
  Symbol(`bench-tsyringe-bind-path-${String(index)}`),
);

function buildBoundValue(): BoundValue {
  return { id: 1 };
}

function buildContainerCreateScenario(): BenchScenario {
  tsyringeRootContainer.createChildContainer();

  return {
    ...CONTAINER_CREATE_EMPTY,
    what: "root.createChildContainer() with nothing registered — tsyringe's only fresh container",
    batch: CONTAINER_CREATE_BATCH,
    sanity: () => !tsyringeRootContainer.createChildContainer().isRegistered(bindTokens[0]!),
    build: () =>
      batched(CONTAINER_CREATE_BATCH, () => {
        tsyringeRootContainer.createChildContainer();
      }),
  };
}

function buildCreateChildScenario(): BenchScenario {
  const parent = tsyringeRootContainer.createChildContainer();
  parent.register<BoundValue>(bindTokens[0]!, { useValue: { id: 0 } });
  parent.createChildContainer();

  return {
    ...CREATE_CHILD_EMPTY,
    what: "parent.createChildContainer() with nothing registered — a per-request container's whole allocation",
    batch: CONTAINER_CREATE_BATCH,
    sanity: () => {
      const child = parent.createChildContainer();
      return child.isRegistered(bindTokens[0]!, true) && !child.isRegistered(bindTokens[0]!);
    },
    build: () =>
      batched(CONTAINER_CREATE_BATCH, () => {
        parent.createChildContainer();
      }),
  };
}

function buildBindPlainScenario(): BenchScenario {
  function bindAll(): DependencyContainer {
    const container = tsyringeRootContainer.createChildContainer();
    for (const bindToken of bindTokens) {
      container.register<BoundValue>(bindToken, { useFactory: buildBoundValue });
    }
    return container;
  }
  bindAll();

  return {
    ...BIND_128_PLAIN,
    what: `register ${String(BIND_TOKEN_COUNT)} factory providers into a fresh child container, no resolve`,
    batch: 1,
    sanity: () => bindAll().resolve<BoundValue>(bindTokens[BIND_TOKEN_COUNT - 1]!).id === 1,
    build: () => {
      return () => {
        bindAll();
      };
    },
  };
}

/**
 * Builds tsyringe's cold-path scenarios.
 */
export function buildTsyringeBootScenarios(): ReadonlyArray<BenchScenario> {
  return [buildContainerCreateScenario(), buildCreateChildScenario(), buildBindPlainScenario()];
}
