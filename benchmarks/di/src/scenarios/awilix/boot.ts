/**
 * Awilix — the cold path, unbundled from a resolve: an empty container, an empty scope of a warm
 * parent, and a container with many transient registrations and no resolve.
 */
import { asFunction, asValue, createContainer } from "awilix";

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

const bindNames = Array.from({ length: BIND_TOKEN_COUNT }, (_value, index) => `boundValue${String(index)}`);

function buildBoundValue(): BoundValue {
  return { id: 1 };
}

function buildContainerCreateScenario(): BenchScenario {
  createContainer();

  return {
    ...CONTAINER_CREATE_EMPTY,
    what: "createContainer() with nothing registered",
    batch: CONTAINER_CREATE_BATCH,
    sanity: () => !createContainer().hasRegistration(bindNames[0]!),
    build: () =>
      batched(CONTAINER_CREATE_BATCH, () => {
        createContainer();
      }),
  };
}

function buildCreateChildScenario(): BenchScenario {
  const parent = createContainer();
  parent.register(bindNames[0]!, asValue({ id: 0 }));
  parent.createScope();

  return {
    ...CREATE_CHILD_EMPTY,
    what: "parent.createScope() with nothing registered — a per-request scope's whole allocation",
    batch: CONTAINER_CREATE_BATCH,
    sanity: () => parent.createScope().hasRegistration(bindNames[0]!),
    build: () =>
      batched(CONTAINER_CREATE_BATCH, () => {
        parent.createScope();
      }),
  };
}

function buildBindPlainScenario(): BenchScenario {
  function bindAll(): ReturnType<typeof createContainer> {
    const container = createContainer();
    for (const name of bindNames) {
      container.register(name, asFunction(buildBoundValue).transient());
    }
    return container;
  }
  bindAll();

  return {
    ...BIND_128_PLAIN,
    what: `register ${String(BIND_TOKEN_COUNT)} transient asFunction() names into a fresh container, no resolve`,
    batch: 1,
    sanity: () => bindAll().resolve<BoundValue>(bindNames[BIND_TOKEN_COUNT - 1]!).id === 1,
    build: () => {
      return () => {
        bindAll();
      };
    },
  };
}

/**
 * Builds Awilix's cold-path scenarios.
 *
 * @since 0.8.0
 */
export function buildAwilixBootScenarios(): ReadonlyArray<BenchScenario> {
  return [buildContainerCreateScenario(), buildCreateChildScenario(), buildBindPlainScenario()];
}
