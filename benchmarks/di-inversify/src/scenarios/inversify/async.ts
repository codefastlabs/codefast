import "reflect-metadata";
import { Container } from "inversify";
import type { ServiceIdentifier } from "inversify";
import type { AsyncBenchScenario } from "#/scenarios/types";

const ASYNC_CHAIN_DEPTH = 8;
const ASYNC_CONCURRENT_FANOUT_COUNTS = [8, 32] as const;

function waitForNextImmediateTick(): Promise<void> {
  return new Promise((resolve) => {
    setImmediate(resolve);
  });
}

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

function buildAsyncFanOutConcurrentScenario(
  concurrency: (typeof ASYNC_CONCURRENT_FANOUT_COUNTS)[number],
): AsyncBenchScenario {
  const dependencyIdentifiers = Array.from({ length: concurrency }, (_value, index) =>
    Symbol(`bench-inv-async-fanout-${String(concurrency)}-${String(index)}`),
  ) as ServiceIdentifier<number>[];
  const container = new Container();

  for (const [index, dependencyIdentifier] of dependencyIdentifiers.entries()) {
    container
      .bind<number>(dependencyIdentifier)
      .toDynamicValue(async () => {
        await waitForNextImmediateTick();
        return index;
      })
      .inTransientScope();
  }

  const expectedTotal = ((concurrency - 1) * concurrency) / 2;

  return {
    id: `async-fanout-concurrent-${String(concurrency)}`,
    group: "async",
    kind: "async",
    what: `resolveAsync ${String(concurrency)} independent async dependencies in parallel via Promise.all`,
    batch: 1,
    sanity: async () => {
      const values = await Promise.all(
        dependencyIdentifiers.map((dependencyIdentifier) =>
          container.getAsync<number>(dependencyIdentifier),
        ),
      );
      const total = values.reduce((runningTotal, value) => runningTotal + value, 0);
      return values.length === concurrency && total === expectedTotal;
    },
    build: () => {
      return async () => {
        const values = await Promise.all(
          dependencyIdentifiers.map((dependencyIdentifier) =>
            container.getAsync<number>(dependencyIdentifier),
          ),
        );
        const total = values.reduce((runningTotal, value) => runningTotal + value, 0);
        if (values.length !== concurrency || total !== expectedTotal) {
          throw new Error(
            `Expected ${String(concurrency)} values with total ${String(expectedTotal)}, received ${String(values.length)} values and total ${String(total)}`,
          );
        }
      };
    },
  };
}

export function buildInversifyAsyncScenarios(): readonly AsyncBenchScenario[] {
  return [
    buildResolveAsyncSingleHopScenario(),
    buildDynamicAsyncChainDepthEightScenario(),
    ...ASYNC_CONCURRENT_FANOUT_COUNTS.map((concurrency) =>
      buildAsyncFanOutConcurrentScenario(concurrency),
    ),
  ];
}
