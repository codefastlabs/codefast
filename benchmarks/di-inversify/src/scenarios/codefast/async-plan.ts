/**
 * @codefast/di — statically-visible graphs entering through `resolveAsync` (codefast-only).
 *
 * The async rows elsewhere are `toDynamicAsync` chains, whose factories are opaque — no compiler can
 * see through them. These two rows are the opposite shape: every dependency is declared up front
 * (`toResolvedAsync` descriptors, `@injectable` constructor params), so the whole graph is visible
 * before the resolve. They price what the async entry pays per level for a graph it could know
 * statically:
 *
 *   plan-async-resolved-chain-8   an 8-step `toResolvedAsync` chain — declared deps, async factories
 *   plan-async-class-chain-8      an 8-step decorated class chain — a fully synchronous graph
 *                                 resolved through the async entry point
 */
import type { Token } from "@codefast/di";
import { Container, injectable, token } from "@codefast/di";

import type { ScenarioDescriptor } from "#/fixtures/scenario-parity";
import { ASYNC_CHAIN_DEPTH } from "#/fixtures/scenario-parity";
import type { AsyncBenchScenario } from "#/scenarios/types";

const PLAN_ASYNC_RESOLVED_CHAIN = {
  id: `plan-async-resolved-chain-${String(ASYNC_CHAIN_DEPTH)}`,
  group: "async",
  what: `resolveAsync() through an ${String(ASYNC_CHAIN_DEPTH)}-step toResolvedAsync chain — every dependency declared, every factory async (codefast-only)`,
} as const satisfies ScenarioDescriptor;

const PLAN_ASYNC_CLASS_CHAIN = {
  id: `plan-async-class-chain-${String(ASYNC_CHAIN_DEPTH)}`,
  group: "async",
  what: `resolveAsync() through an ${String(ASYNC_CHAIN_DEPTH)}-step decorated class chain — a fully synchronous graph entering through the async entry (codefast-only)`,
} as const satisfies ScenarioDescriptor;

function buildResolvedAsyncChainScenario(): AsyncBenchScenario {
  const chainTokens = Array.from({ length: ASYNC_CHAIN_DEPTH }, (_value, level) =>
    token<number>(`bench-cf-plan-async-resolved-${String(level)}`),
  );
  const container = Container.create();

  container.bind(chainTokens[0]!).toConstantValue(0);
  for (let level = 1; level < ASYNC_CHAIN_DEPTH; level++) {
    container
      .bind(chainTokens[level]!)
      .toResolvedAsync(async (previous: number) => previous + 1, [chainTokens[level - 1]!])
      .transient();
  }

  const leafToken = chainTokens[ASYNC_CHAIN_DEPTH - 1]!;
  const expectedLeafValue = ASYNC_CHAIN_DEPTH - 1;

  return {
    ...PLAN_ASYNC_RESOLVED_CHAIN,
    kind: "async",
    batch: 1,
    sanity: async () => (await container.resolveAsync(leafToken)) === expectedLeafValue,
    build: () => {
      return async () => {
        const value = await container.resolveAsync(leafToken);

        if (value !== expectedLeafValue) {
          throw new Error(`Expected resolved-async leaf value ${String(expectedLeafValue)}, received ${String(value)}`);
        }
      };
    },
  };
}

function buildClassChainAsyncScenario(): AsyncBenchScenario {
  const container = Container.create();

  @injectable()
  class Level0 {
    readonly depth = 0;
  }

  let previousClass: Token<{ depth: number }> | (new () => { depth: number }) = Level0;
  container.bind(Level0).toSelf().transient();
  for (let level = 1; level < ASYNC_CHAIN_DEPTH; level++) {
    const parent = previousClass;

    @injectable([parent])
    class LevelN {
      readonly depth: number;
      constructor(readonly previous: { depth: number }) {
        this.depth = previous.depth + 1;
      }
    }
    Object.defineProperty(LevelN, "name", { value: `PlanAsyncClassLevel${String(level)}` });
    container.bind(LevelN).toSelf().transient();
    previousClass = LevelN;
  }

  const rootClass = previousClass as new () => { depth: number };
  const expectedDepth = ASYNC_CHAIN_DEPTH - 1;

  return {
    ...PLAN_ASYNC_CLASS_CHAIN,
    kind: "async",
    batch: 1,
    sanity: async () => (await container.resolveAsync(rootClass)).depth === expectedDepth,
    build: () => {
      return async () => {
        const instance = await container.resolveAsync(rootClass);

        if (instance.depth !== expectedDepth) {
          throw new Error(`Expected class chain depth ${String(expectedDepth)}, received ${String(instance.depth)}`);
        }
      };
    },
  };
}

export function buildCodefastAsyncPlanScenarios(): ReadonlyArray<AsyncBenchScenario> {
  return [buildResolvedAsyncChainScenario(), buildClassChainAsyncScenario()];
}
