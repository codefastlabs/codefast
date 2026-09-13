/**
 * InversifyJS 8 — the async entry points beyond a single chain: a collection awaited as one, the
 * optional async miss, and a diamond whose two siblings share one async leaf.
 */
import "reflect-metadata";
import { Container } from "inversify";

import {
  ASYNC_DIAMOND_SHARED_LEAF,
  ASYNC_STRATEGY_COUNT,
  RESOLVE_ALL_ASYNC,
  RESOLVE_OPTIONAL_ASYNC_MISS,
} from "#/fixtures/scenario-parity";
import type { AsyncBenchScenario } from "#/scenarios/types";

function buildResolveAllAsyncScenario(): AsyncBenchScenario {
  const strategyIdentifier = Symbol("bench-inv-async-resolve-all-strategy");
  const container = new Container({ jitless: false });
  for (let index = 0; index < ASYNC_STRATEGY_COUNT; index++) {
    container
      .bind<number>(strategyIdentifier)
      .toDynamicValue(async () => {
        await Promise.resolve();
        return index;
      })
      .inTransientScope()
      .when(() => true);
  }
  const expectedTotal = ((ASYNC_STRATEGY_COUNT - 1) * ASYNC_STRATEGY_COUNT) / 2;

  return {
    ...RESOLVE_ALL_ASYNC,
    what: `getAllAsync() across ${String(ASYNC_STRATEGY_COUNT)} async toDynamicValue bindings on one identifier`,
    kind: "async",
    batch: 1,
    sanity: async () => {
      const values = await container.getAllAsync<number>(strategyIdentifier);
      return (
        values.length === ASYNC_STRATEGY_COUNT && values.reduce((total, value) => total + value, 0) === expectedTotal
      );
    },
    build: () => {
      return async () => {
        const values = await container.getAllAsync<number>(strategyIdentifier);
        if (values.length !== ASYNC_STRATEGY_COUNT) {
          throw new Error(
            `Expected ${String(ASYNC_STRATEGY_COUNT)} async strategies, received ${String(values.length)}`,
          );
        }
      };
    },
  };
}

function buildResolveOptionalAsyncMissScenario(): AsyncBenchScenario {
  const missingIdentifier = Symbol("bench-inv-async-optional-missing");
  const boundIdentifier = Symbol("bench-inv-async-optional-bound");
  const container = new Container({ jitless: false });
  container.bind<number>(boundIdentifier).toConstantValue(1);

  return {
    ...RESOLVE_OPTIONAL_ASYNC_MISS,
    what: "getAsync(id, { optional: true }) when no binding exists — the async miss, resolved without instantiating",
    kind: "async",
    batch: 1,
    sanity: async () =>
      (await container.getAsync<number>(missingIdentifier, { optional: true })) === undefined &&
      (await container.getAsync<number>(boundIdentifier, { optional: true })) === 1,
    build: () => {
      return async () => {
        const value = await container.getAsync<number>(missingIdentifier, { optional: true });
        if (value !== undefined) {
          throw new Error(`Expected the unbound identifier to resolve to undefined, received ${String(value)}`);
        }
      };
    },
  };
}

function buildAsyncDiamondSharedLeafScenario(): AsyncBenchScenario {
  const leafIdentifier = Symbol("bench-inv-async-diamond-leaf");
  const leftIdentifier = Symbol("bench-inv-async-diamond-left");
  const rightIdentifier = Symbol("bench-inv-async-diamond-right");
  const rootIdentifier = Symbol("bench-inv-async-diamond-root");
  const container = new Container({ jitless: false });

  container
    .bind<number>(leafIdentifier)
    .toDynamicValue(async () => {
      await Promise.resolve();
      return 1;
    })
    .inTransientScope();
  for (const siblingIdentifier of [leftIdentifier, rightIdentifier]) {
    container
      .bind<number>(siblingIdentifier)
      .toDynamicValue(async (resolutionContext) => (await resolutionContext.getAsync<number>(leafIdentifier)) + 1)
      .inTransientScope();
  }
  container
    .bind<number>(rootIdentifier)
    .toDynamicValue(async (resolutionContext) => {
      const [left, right] = await Promise.all([
        resolutionContext.getAsync<number>(leftIdentifier),
        resolutionContext.getAsync<number>(rightIdentifier),
      ]);
      return left + right;
    })
    .inTransientScope();
  const expectedRootValue = 4;

  return {
    ...ASYNC_DIAMOND_SHARED_LEAF,
    what: "getAsync() a root awaiting two siblings in parallel that share one async leaf",
    kind: "async",
    batch: 1,
    sanity: async () => (await container.getAsync<number>(rootIdentifier)) === expectedRootValue,
    build: () => {
      return async () => {
        const value = await container.getAsync<number>(rootIdentifier);
        if (value !== expectedRootValue) {
          throw new Error(`Expected async diamond root value ${String(expectedRootValue)}, received ${String(value)}`);
        }
      };
    },
  };
}

/**
 * Builds inversify's async entry-point scenarios.
 */
export function buildInversifyAsyncEntryPointScenarios(): ReadonlyArray<AsyncBenchScenario> {
  return [
    buildResolveAllAsyncScenario(),
    buildResolveOptionalAsyncMissScenario(),
    buildAsyncDiamondSharedLeafScenario(),
  ];
}
