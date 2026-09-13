/**
 * Ditox — the cold path, unbundled from a resolve: an empty container, an empty child of a warm
 * parent, and many transient factory bindings with no resolve.
 */
import type { Container } from "ditox";
import { createContainer, token } from "ditox";

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
  token<BoundValue>(`bench-ditox-bind-path-${String(index)}`),
);

function buildBoundValue(): BoundValue {
  return { id: 1 };
}

function buildContainerCreateScenario(): BenchScenario {
  createContainer();

  return {
    ...CONTAINER_CREATE_EMPTY,
    what: "createContainer() with nothing bound",
    batch: CONTAINER_CREATE_BATCH,
    sanity: () => !createContainer().hasToken(bindTokens[0]!),
    build: () =>
      batched(CONTAINER_CREATE_BATCH, () => {
        createContainer();
      }),
  };
}

function buildCreateChildScenario(): BenchScenario {
  const parent = createContainer();
  parent.bindValue(bindTokens[0]!, { id: 0 });
  createContainer(parent);

  return {
    ...CREATE_CHILD_EMPTY,
    what: "createContainer(parent) with nothing bound — a per-request container's whole allocation",
    batch: CONTAINER_CREATE_BATCH,
    sanity: () => createContainer(parent).resolve(bindTokens[0]!).id === 0,
    build: () =>
      batched(CONTAINER_CREATE_BATCH, () => {
        createContainer(parent);
      }),
  };
}

function buildBindPlainScenario(): BenchScenario {
  function bindAll(): Container {
    const container = createContainer();
    for (const bindToken of bindTokens) {
      container.bindFactory(bindToken, buildBoundValue, { scope: "transient" });
    }
    return container;
  }
  bindAll();

  return {
    ...BIND_128_PLAIN,
    what: `bindFactory ${String(BIND_TOKEN_COUNT)} transient tokens into a fresh container, no resolve`,
    batch: 1,
    sanity: () => bindAll().resolve(bindTokens[BIND_TOKEN_COUNT - 1]!).id === 1,
    build: () => {
      return () => {
        bindAll();
      };
    },
  };
}

/**
 * Builds ditox's cold-path scenarios.
 */
export function buildDitoxBootScenarios(): ReadonlyArray<BenchScenario> {
  return [buildContainerCreateScenario(), buildCreateChildScenario(), buildBindPlainScenario()];
}
