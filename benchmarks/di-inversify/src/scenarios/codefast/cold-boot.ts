/**
 * `@codefast/di` — the cold path, unbundled from a resolve (codefast-only).
 *
 * Every cold row the suite has bundles container construction, binding and a resolve into one
 * iteration, so none of them can attribute a change to one of the three. A container defers eleven
 * maps to first use and a fluent chain registers once and refines in place — two claims about
 * construction and bind alone, which a resolve row cannot see and these four can:
 *
 *   container-create-empty   an empty container, nothing bound
 *   create-child-empty       the same for a child, whose parent is warm
 *   bind-128-plain           one container, 128 tokens bound and never refined
 *   bind-128-refined         the same 128 with a scope and a slot written after registration
 *
 * The two bind rows each pay one container create, which `container-create-empty` prices, and differ
 * from each other only by the refinements — so both terms are subtractable.
 */
import { Container, token } from "@codefast/di";

import type { ScenarioDescriptor } from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

const CONTAINER_CREATE_BATCH = 100;
const BIND_TOKEN_COUNT = 128;

interface BoundValue {
  readonly id: number;
}

const CONTAINER_CREATE_EMPTY = {
  id: "container-create-empty",
  group: "boot",
  what: "Container.create() with nothing bound — the constructor plus whatever it does not defer (codefast-only)",
} as const satisfies ScenarioDescriptor;

const CREATE_CHILD_EMPTY = {
  id: "create-child-empty",
  group: "boot",
  what: "parent.createChild() with nothing bound — a per-request container's whole allocation (codefast-only)",
} as const satisfies ScenarioDescriptor;

const bindTokens = Array.from({ length: BIND_TOKEN_COUNT }, (_value, index) =>
  token<BoundValue>(`bench-cf-bind-path-${String(index)}`),
);

/** Hoisted so the rows measure the bind path rather than closure allocation. */
function buildBoundValue(): BoundValue {
  return { id: 1 };
}

function buildContainerCreateScenario(): BenchScenario {
  Container.create();

  return {
    ...CONTAINER_CREATE_EMPTY,
    batch: CONTAINER_CREATE_BATCH,
    sanity: () => !Container.create().has(bindTokens[0]!),
    build: () =>
      batched(CONTAINER_CREATE_BATCH, () => {
        Container.create();
      }),
  };
}

function buildCreateChildScenario(): BenchScenario {
  const parent = Container.create();

  parent.bind(bindTokens[0]!).toConstantValue({ id: 0 });
  parent.createChild();

  return {
    ...CREATE_CHILD_EMPTY,
    batch: CONTAINER_CREATE_BATCH,
    // A child that can see the parent's binding but owns none of its own.
    sanity: () => {
      const child = parent.createChild();

      return child.has(bindTokens[0]!) && !child.hasOwn(bindTokens[0]!);
    },
    build: () =>
      batched(CONTAINER_CREATE_BATCH, () => {
        parent.createChild();
      }),
  };
}

function buildBindPathScenario(descriptor: ScenarioDescriptor, refine: boolean): BenchScenario {
  function bindAll(): Container {
    const container = Container.create();

    for (const [index, bindToken] of bindTokens.entries()) {
      const chain = container.bind(bindToken).toDynamic(buildBoundValue);

      if (refine) {
        chain.whenNamed(`slot-${String(index)}`).singleton();
      }
    }

    return container;
  }

  bindAll();

  return {
    ...descriptor,
    batch: 1,
    sanity: () => {
      const container = bindAll();
      const lastToken = bindTokens[BIND_TOKEN_COUNT - 1]!;

      return refine
        ? container.resolve(lastToken, { name: `slot-${String(BIND_TOKEN_COUNT - 1)}` }).id === 1
        : container.resolve(lastToken).id === 1;
    },
    build: () => {
      return () => {
        bindAll();
      };
    },
  };
}

/**
 * @since 0.6.0
 */
export function buildCodefastColdBootScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildContainerCreateScenario(),
    buildCreateChildScenario(),
    buildBindPathScenario(
      {
        id: `bind-${String(BIND_TOKEN_COUNT)}-plain`,
        group: "boot",
        what: `bind ${String(BIND_TOKEN_COUNT)} tokens into a fresh container, no refinement — registration only (codefast-only)`,
      },
      false,
    ),
    buildBindPathScenario(
      {
        id: `bind-${String(BIND_TOKEN_COUNT)}-refined`,
        group: "boot",
        what: `the same ${String(BIND_TOKEN_COUNT)} refined after registration with .whenNamed().singleton() — one re-slot and one in-place scope write each (codefast-only)`,
      },
      true,
    ),
  ];
}
