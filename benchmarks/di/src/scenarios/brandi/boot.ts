/**
 * Brandi — the cold path, unbundled from a resolve: an empty container, an empty container extending
 * a warm parent, and many transient bindings with no resolve.
 */
import type { Container } from "brandi";
import { createContainer, token } from "brandi";

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
  token<BoundValue>(`bench-brandi-bind-path-${String(index)}`),
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
    sanity: () => {
      try {
        createContainer().get(bindTokens[0]!);
        return false;
      } catch {
        return true;
      }
    },
    build: () =>
      batched(CONTAINER_CREATE_BATCH, () => {
        createContainer();
      }),
  };
}

function buildCreateChildScenario(): BenchScenario {
  const parent = createContainer();
  parent.bind(bindTokens[0]!).toConstant({ id: 0 });
  createContainer().extend(parent);

  return {
    ...CREATE_CHILD_EMPTY,
    what: "createContainer().extend(parent) with nothing bound — a per-request container's whole allocation",
    batch: CONTAINER_CREATE_BATCH,
    sanity: () => createContainer().extend(parent).get(bindTokens[0]!).id === 0,
    build: () =>
      batched(CONTAINER_CREATE_BATCH, () => {
        createContainer().extend(parent);
      }),
  };
}

function buildBindPlainScenario(): BenchScenario {
  function bindAll(): Container {
    const container = createContainer();
    for (const bindToken of bindTokens) {
      container.bind(bindToken).toInstance(buildBoundValue).inTransientScope();
    }
    return container;
  }
  bindAll();

  return {
    ...BIND_128_PLAIN,
    what: `bind ${String(BIND_TOKEN_COUNT)} transient toInstance() factories into a fresh container, no resolve`,
    batch: 1,
    sanity: () => bindAll().get(bindTokens[BIND_TOKEN_COUNT - 1]!).id === 1,
    build: () => {
      return () => {
        bindAll();
      };
    },
  };
}

/**
 * Builds brandi's cold-path scenarios.
 */
export function buildBrandiBootScenarios(): ReadonlyArray<BenchScenario> {
  return [buildContainerCreateScenario(), buildCreateChildScenario(), buildBindPlainScenario()];
}
