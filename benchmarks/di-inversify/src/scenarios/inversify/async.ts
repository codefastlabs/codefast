import "reflect-metadata";
import { Container } from "inversify";
import type { ServiceIdentifier } from "inversify";
import type { AsyncBenchScenario } from "#/scenarios/types";

const ASYNC_CHAIN_DEPTH = 8;

function buildResolveAsyncSingleHopScenario(): AsyncBenchScenario {
  const asyncValueIdentifier = Symbol("bench-inv-async-single-hop");
  const container = new Container();
  container
    .bind<number>(asyncValueIdentifier)
    .toDynamicValue(async () => {
      await Promise.resolve();
      return 42;
    })
    .inSingletonScope();

  return {
    id: "resolve-async-single-hop",
    group: "async",
    kind: "async",
    what: "resolveAsync() one singleton async factory (warm path after first await)",
    batch: 1,
    sanity: async () => {
      const value = await container.getAsync<number>(asyncValueIdentifier);
      return value === 42;
    },
    build: () => {
      return async () => {
        const value = await container.getAsync<number>(asyncValueIdentifier);
        if (value !== 42) {
          throw new Error(`Expected async singleton value 42, received ${String(value)}`);
        }
      };
    },
  };
}

function buildDynamicAsyncChainDepthEightScenario(): AsyncBenchScenario {
  const chainIdentifiers = Array.from({ length: ASYNC_CHAIN_DEPTH }, (_value, depthIndex) =>
    Symbol(`bench-inv-async-chain-${String(depthIndex)}`),
  ) as ServiceIdentifier<number>[];
  const container = new Container();

  container.bind<number>(chainIdentifiers[0]!).toConstantValue(0);
  for (let depthIndex = 1; depthIndex < ASYNC_CHAIN_DEPTH; depthIndex++) {
    const previousIdentifier = chainIdentifiers[depthIndex - 1]!;
    const currentIdentifier = chainIdentifiers[depthIndex]!;
    container
      .bind<number>(currentIdentifier)
      .toDynamicValue(async (resolutionContext) => {
        const previousValue = await resolutionContext.getAsync<number>(previousIdentifier);
        return previousValue + 1;
      })
      .inTransientScope();
  }

  const leafIdentifier = chainIdentifiers[ASYNC_CHAIN_DEPTH - 1]!;
  const expectedLeafValue = ASYNC_CHAIN_DEPTH - 1;

  return {
    id: "dynamic-async-chain-8",
    group: "async",
    kind: "async",
    what: "resolveAsync() through an 8-step transient async dynamic chain",
    batch: 1,
    sanity: async () => {
      const value = await container.getAsync<number>(leafIdentifier);
      return value === expectedLeafValue;
    },
    build: () => {
      return async () => {
        const value = await container.getAsync<number>(leafIdentifier);
        if (value !== expectedLeafValue) {
          throw new Error(
            `Expected async chain leaf value ${String(expectedLeafValue)}, received ${String(value)}`,
          );
        }
      };
    },
  };
}

export function buildInversifyAsyncScenarios(): readonly AsyncBenchScenario[] {
  return [buildResolveAsyncSingleHopScenario(), buildDynamicAsyncChainDepthEightScenario()];
}
