/**
 * Library-free runtime-floor controls, collected by BOTH bench children.
 *
 * These scenarios involve no DI library at all — both sides run byte-identical
 * code, so the pair calibrates the two child processes against each other and
 * gives readers a floor to subtract from same-shape library rows (e.g.
 * `dynamic-async-chain-8` minus `baseline-async-chain-8` isolates the DI
 * overhead from V8's async/promise machinery, which dominates sub-µs rows).
 * The reporter lists them separately and never counts them as wins or losses.
 */
import { batched } from "#/harness/batched";
import type { AnyScenario, AsyncBenchScenario, BenchScenario } from "#/scenarios/types";

const ASYNC_CHAIN_DEPTH = 8;
const ASYNC_FANOUT_CONCURRENCY = 8;
const SYNC_CALL_BATCH = 1000;

function buildBaselineAsyncChainScenario(): AsyncBenchScenario {
  const chainFns: Array<() => Promise<number>> = [async () => 0];
  for (let depthIndex = 1; depthIndex < ASYNC_CHAIN_DEPTH; depthIndex++) {
    const previousFn = chainFns[depthIndex - 1]!;
    chainFns.push(async () => (await previousFn()) + 1);
  }
  const leafFn = chainFns[ASYNC_CHAIN_DEPTH - 1]!;
  const expectedLeafValue = ASYNC_CHAIN_DEPTH - 1;

  return {
    id: "baseline-async-chain-8",
    group: "baseline",
    kind: "async",
    what: "runtime floor: the same 8-step await chain with no DI library involved",
    batch: 1,
    sanity: async () => (await leafFn()) === expectedLeafValue,
    build: () => {
      return async () => {
        const value = await leafFn();
        if (value !== expectedLeafValue) {
          throw new Error(`Expected baseline chain value ${String(expectedLeafValue)}, received ${String(value)}`);
        }
      };
    },
  };
}

function buildBaselineAsyncFanOutScenario(): AsyncBenchScenario {
  // Floor for the async-fanout rows: same Promise.all shape and microtask yield, no DI.
  const fanOutFns = Array.from({ length: ASYNC_FANOUT_CONCURRENCY }, (_value, index) => async () => {
    await Promise.resolve();
    return index;
  });
  const expectedTotal = ((ASYNC_FANOUT_CONCURRENCY - 1) * ASYNC_FANOUT_CONCURRENCY) / 2;
  const sumAll = async (): Promise<number> => {
    const values = await Promise.all(fanOutFns.map((fanOutFn) => fanOutFn()));
    return values.reduce((runningTotal, value) => runningTotal + value, 0);
  };

  return {
    id: `baseline-async-fanout-${String(ASYNC_FANOUT_CONCURRENCY)}`,
    group: "baseline",
    kind: "async",
    what: "runtime floor: the same Promise.all microtask fan-out with no DI library involved",
    batch: 1,
    sanity: async () => (await sumAll()) === expectedTotal,
    build: () => {
      return async () => {
        const total = await sumAll();
        if (total !== expectedTotal) {
          throw new Error(`Expected baseline fan-out total ${String(expectedTotal)}, received ${String(total)}`);
        }
      };
    },
  };
}

function buildBaselineSyncCallScenario(): BenchScenario {
  // Floor for the sub-µs sync rows: a plain map lookup + function call, no DI.
  const registry = new Map<string, () => number>([["value", () => 42]]);

  return {
    id: "baseline-sync-map-call",
    group: "baseline",
    what: "runtime floor: Map lookup + call with no DI library involved",
    batch: SYNC_CALL_BATCH,
    sanity: () => registry.get("value")!() === 42,
    build: () =>
      batched(SYNC_CALL_BATCH, () => {
        registry.get("value")!();
      }),
  };
}

export function buildBaselineScenarios(): ReadonlyArray<AnyScenario> {
  return [buildBaselineAsyncChainScenario(), buildBaselineAsyncFanOutScenario(), buildBaselineSyncCallScenario()];
}
