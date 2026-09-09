import { Container, token } from "@codefast/di";

import {
  ASYNC_CHAIN_DEPTH,
  ASYNC_CONCURRENT_FANOUT_COUNTS,
  DYNAMIC_ASYNC_CHAIN_8,
  RESOLVE_ASYNC_SINGLE_HOP,
  asyncFanoutConcurrentDescriptor,
} from "#/fixtures/scenario-parity";
import type { AsyncBenchScenario } from "#/scenarios/types";

// Fan-out factories yield via microtask, not setImmediate: a macrotask wait (~15µs on
// Apple silicon) dwarfs both libraries' machinery and the row degrades into measuring libuv.
function yieldToMicrotaskQueue(): Promise<void> {
  return Promise.resolve();
}

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
    ...RESOLVE_ASYNC_SINGLE_HOP,
    kind: "async",
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
    ...DYNAMIC_ASYNC_CHAIN_8,
    kind: "async",
    batch: 1,
    sanity: async () => {
      const value = await container.resolveAsync(leafToken);
      return value === expectedLeafValue;
    },
    build: () => {
      return async () => {
        const value = await container.resolveAsync(leafToken);
        if (value !== expectedLeafValue) {
          throw new Error(`Expected async chain leaf value ${String(expectedLeafValue)}, received ${String(value)}`);
        }
      };
    },
  };
}

function buildAsyncFanOutConcurrentScenario(
  concurrency: (typeof ASYNC_CONCURRENT_FANOUT_COUNTS)[number],
): AsyncBenchScenario {
  const dependencyTokens = Array.from({ length: concurrency }, (_value, index) =>
    token<number>(`bench-cf-async-fanout-${String(concurrency)}-${String(index)}`),
  );
  const container = Container.create();
  for (const [index, dependencyToken] of dependencyTokens.entries()) {
    container
      .bind(dependencyToken)
      .toDynamicAsync(async () => {
        await yieldToMicrotaskQueue();
        return index;
      })
      .transient();
  }

  const expectedTotal = ((concurrency - 1) * concurrency) / 2;

  return {
    ...asyncFanoutConcurrentDescriptor(concurrency),
    kind: "async",
    batch: 1,
    sanity: async () => {
      const values = await Promise.all(
        dependencyTokens.map((dependencyToken) => container.resolveAsync(dependencyToken)),
      );
      const total = values.reduce((runningTotal, value) => runningTotal + value, 0);
      return values.length === concurrency && total === expectedTotal;
    },
    build: () => {
      return async () => {
        const values = await Promise.all(
          dependencyTokens.map((dependencyToken) => container.resolveAsync(dependencyToken)),
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

/**
 * @since 0.3.16-canary.0
 */
export function buildCodefastAsyncScenarios(): ReadonlyArray<AsyncBenchScenario> {
  return [
    buildResolveAsyncSingleHopScenario(),
    buildDynamicAsyncChainDepthEightScenario(),
    ...ASYNC_CONCURRENT_FANOUT_COUNTS.map((concurrency) => buildAsyncFanOutConcurrentScenario(concurrency)),
  ];
}
