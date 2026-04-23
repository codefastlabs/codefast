import { Container, token } from "@codefast/di";
import type { AsyncBenchScenario } from "#/scenarios/types";

const ASYNC_CHAIN_DEPTH = 8;

function buildResolveAsyncSingleHopScenario(): AsyncBenchScenario {
  const asyncValueToken = token<number>("bench-cf-async-single-hop");
  const container = Container.create();
  container
    .bind(asyncValueToken)
    .toDynamicAsync(async () => {
      await Promise.resolve();
      return 42;
    })
    .singleton();

  return {
    id: "resolve-async-single-hop",
    group: "async",
    kind: "async",
    what: "resolveAsync() one singleton async factory (warm path after first await)",
    batch: 1,
    sanity: async () => {
      const value = await container.resolveAsync(asyncValueToken);
      return value === 42;
    },
    build: () => {
      return async () => {
        const value = await container.resolveAsync(asyncValueToken);
        if (value !== 42) {
          throw new Error(`Expected async singleton value 42, received ${String(value)}`);
        }
      };
    },
  };
}

function buildDynamicAsyncChainDepthEightScenario(): AsyncBenchScenario {
  const chainTokens = Array.from({ length: ASYNC_CHAIN_DEPTH }, (_value, depthIndex) =>
    token<number>(`bench-cf-async-chain-${String(depthIndex)}`),
  );
  const container = Container.create();

  container.bind(chainTokens[0]!).toConstantValue(0);
  for (let depthIndex = 1; depthIndex < ASYNC_CHAIN_DEPTH; depthIndex++) {
    const previousToken = chainTokens[depthIndex - 1]!;
    const currentToken = chainTokens[depthIndex]!;
    container
      .bind(currentToken)
      .toDynamicAsync(async (resolutionContext) => {
        const previousValue = await resolutionContext.resolveAsync(previousToken);
        return previousValue + 1;
      })
      .transient();
  }

  const leafToken = chainTokens[ASYNC_CHAIN_DEPTH - 1]!;
  const expectedLeafValue = ASYNC_CHAIN_DEPTH - 1;

  return {
    id: "dynamic-async-chain-8",
    group: "async",
    kind: "async",
    what: "resolveAsync() through an 8-step transient async dynamic chain",
    batch: 1,
    sanity: async () => {
      const value = await container.resolveAsync(leafToken);
      return value === expectedLeafValue;
    },
    build: () => {
      return async () => {
        const value = await container.resolveAsync(leafToken);
        if (value !== expectedLeafValue) {
          throw new Error(
            `Expected async chain leaf value ${String(expectedLeafValue)}, received ${String(value)}`,
          );
        }
      };
    },
  };
}

export function buildCodefastAsyncScenarios(): readonly AsyncBenchScenario[] {
  return [buildResolveAsyncSingleHopScenario(), buildDynamicAsyncChainDepthEightScenario()];
}
