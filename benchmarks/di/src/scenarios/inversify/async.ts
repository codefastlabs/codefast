import "reflect-metadata";
import { Container } from "inversify";
import type { ServiceIdentifier } from "inversify";

import {
  ASYNC_CHAIN_DEPTH,
  ASYNC_CONCURRENT_FANOUT_COUNTS,
  ASYNC_INIT_SINGLE_HOP,
  DYNAMIC_ASYNC_CHAIN_8,
  RESOLVE_ASYNC_SINGLE_HOP,
  asyncFanoutConcurrentDescriptor,
} from "#/fixtures/scenario-parity";
import type { AsyncBenchScenario } from "#/scenarios/types";

class AsyncInitService {
  readonly ready = true;
}

// Fan-out factories yield via microtask, not setImmediate: a macrotask wait (~15µs on
// Apple silicon) dwarfs both libraries' machinery and the row degrades into measuring libuv.
function yieldToMicrotaskQueue(): Promise<void> {
  return Promise.resolve();
}

function buildResolveAsyncSingleHopScenario(): AsyncBenchScenario {
  const asyncValueIdentifier = Symbol("bench-inv-async-single-hop");
  const container = new Container({ jitless: false });
  container
    .bind<number>(asyncValueIdentifier)
    .toDynamicValue(async () => {
      await Promise.resolve();
      return 42;
    })
    .inSingletonScope();

  return {
    ...RESOLVE_ASYNC_SINGLE_HOP,
    kind: "async",
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
  ) as Array<ServiceIdentifier<number>>;
  const container = new Container({ jitless: false });

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
    ...DYNAMIC_ASYNC_CHAIN_8,
    kind: "async",
    batch: 1,
    sanity: async () => {
      const value = await container.getAsync<number>(leafIdentifier);
      return value === expectedLeafValue;
    },
    build: () => {
      return async () => {
        const value = await container.getAsync<number>(leafIdentifier);
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
  const dependencyIdentifiers = Array.from({ length: concurrency }, (_value, index) =>
    Symbol(`bench-inv-async-fanout-${String(concurrency)}-${String(index)}`),
  ) as Array<ServiceIdentifier<number>>;
  const container = new Container({ jitless: false });

  for (const [index, dependencyIdentifier] of dependencyIdentifiers.entries()) {
    container
      .bind<number>(dependencyIdentifier)
      .toDynamicValue(async () => {
        await yieldToMicrotaskQueue();
        return index;
      })
      .inTransientScope();
  }

  const expectedTotal = ((concurrency - 1) * concurrency) / 2;

  return {
    ...asyncFanoutConcurrentDescriptor(concurrency),
    kind: "async",
    batch: 1,
    sanity: async () => {
      const values = await Promise.all(
        dependencyIdentifiers.map((dependencyIdentifier) => container.getAsync<number>(dependencyIdentifier)),
      );
      const total = values.reduce((runningTotal, value) => runningTotal + value, 0);
      return values.length === concurrency && total === expectedTotal;
    },
    build: () => {
      return async () => {
        const values = await Promise.all(
          dependencyIdentifiers.map((dependencyIdentifier) => container.getAsync<number>(dependencyIdentifier)),
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

function buildAsyncInitSingleHopScenario(): AsyncBenchScenario {
  const asyncServiceIdentifier = Symbol("bench-inv-async-init-single-hop");
  const container = new Container({ jitless: false });
  container
    .bind<AsyncInitService>(asyncServiceIdentifier)
    .toDynamicValue(async () => {
      await Promise.resolve();
      return new AsyncInitService();
    })
    .inTransientScope();

  return {
    ...ASYNC_INIT_SINGLE_HOP,
    what: "getAsync() one transient async dynamic value, rebuilt each iteration (cold path)",
    kind: "async",
    batch: 1,
    sanity: async () => (await container.getAsync<AsyncInitService>(asyncServiceIdentifier)).ready,
    build: () => {
      return async () => {
        const service = await container.getAsync<AsyncInitService>(asyncServiceIdentifier);
        if (!service.ready) {
          throw new Error("Expected async-constructed service to be ready");
        }
      };
    },
  };
}

/**
 * @since 0.3.16-canary.0
 */
export function buildInversifyAsyncScenarios(): ReadonlyArray<AsyncBenchScenario> {
  return [
    buildResolveAsyncSingleHopScenario(),
    buildAsyncInitSingleHopScenario(),
    buildDynamicAsyncChainDepthEightScenario(),
    ...ASYNC_CONCURRENT_FANOUT_COUNTS.map((concurrency) => buildAsyncFanOutConcurrentScenario(concurrency)),
  ];
}
