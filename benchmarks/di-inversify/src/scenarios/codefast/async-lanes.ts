/**
 * `@codefast/di` — the async lanes the existing async rows never reach (codefast-only).
 *
 * Every row in `async.ts` requests its dependency from a factory's **synchronous prefix**, which is
 * the one shape the cascade lane serves: the ancestor chain is the live call stack, so nothing is
 * allocated per level. A request made after an `await` has no such stack, so it escapes to the
 * append-only branch lane, which carries a context and a path per level instead. The first two rows
 * price that boundary as a ladder against `dynamic-async-chain-8` — the same eight-level chain with
 * no crossing at all:
 *
 *   dynamic-async-chain-8               0 crossings — cascade at every level
 *   async-branch-escape-mid-chain-8     1 crossing  — cascade above it, branch below
 *   async-branch-chain-8                8 crossings — branch at every level
 *
 * The third row is the diamond: two siblings awaited in parallel needing one leaf. It is the shape
 * that says whether the cascade releases a binding when its factory returns its promise, since the
 * second sibling reaches the leaf while the first is still unsettled.
 */
import { Container, token } from "@codefast/di";

import type { ScenarioDescriptor } from "#/fixtures/scenario-parity";
import { ASYNC_CHAIN_DEPTH } from "#/fixtures/scenario-parity";
import type { AsyncBenchScenario } from "#/scenarios/types";

const ASYNC_BRANCH_CHAIN = {
  id: `async-branch-chain-${String(ASYNC_CHAIN_DEPTH)}`,
  group: "async",
  what: `resolveAsync() through an ${String(ASYNC_CHAIN_DEPTH)}-step async chain whose every factory requests after an await — branch lane at every level (codefast-only)`,
} as const satisfies ScenarioDescriptor;

/**
 * Half the chain either side of the crossing, so neither lane dominates the row. Floored so it lands
 * on a real level for any depth: an integer level is what `level === …` can ever match.
 */
const MID_CHAIN_ESCAPE_LEVEL = Math.floor(ASYNC_CHAIN_DEPTH / 2);

const ASYNC_BRANCH_ESCAPE_MID_CHAIN = {
  id: `async-branch-escape-mid-chain-${String(ASYNC_CHAIN_DEPTH)}`,
  group: "async",
  what: `resolveAsync() through the same chain with one level requesting after an await — the single cascade→branch crossing (codefast-only)`,
} as const satisfies ScenarioDescriptor;

const ASYNC_DIAMOND_SHARED_LEAF = {
  id: "async-diamond-shared-leaf",
  group: "async",
  what: "resolveAsync() a root awaiting two siblings in parallel that share one async leaf — the leaf released on promise return, not on settle (codefast-only)",
} as const satisfies ScenarioDescriptor;

/**
 * An eight-level async chain whose factories request their dependency either from the synchronous
 * prefix (cascade) or from a continuation (branch), per level.
 *
 * @param descriptor - the row identity the scenario reports under
 * @param requestsAfterAwait - given a level's index, whether that factory awaits before requesting
 */
function buildAsyncChainScenario(
  descriptor: ScenarioDescriptor,
  requestsAfterAwait: (level: number) => boolean,
): AsyncBenchScenario {
  const chainTokens = Array.from({ length: ASYNC_CHAIN_DEPTH }, (_value, level) =>
    token<number>(`bench-cf-${descriptor.id}-${String(level)}`),
  );
  const container = Container.create();

  container.bind(chainTokens[0]!).toConstantValue(0);
  for (let level = 1; level < ASYNC_CHAIN_DEPTH; level++) {
    const previousToken = chainTokens[level - 1]!;

    container
      .bind(chainTokens[level]!)
      .toDynamicAsync(
        requestsAfterAwait(level)
          ? async (resolutionContext) => {
              await Promise.resolve();

              return (await resolutionContext.resolveAsync(previousToken)) + 1;
            }
          : async (resolutionContext) => (await resolutionContext.resolveAsync(previousToken)) + 1,
      )
      .transient();
  }

  const leafToken = chainTokens[ASYNC_CHAIN_DEPTH - 1]!;
  const expectedLeafValue = ASYNC_CHAIN_DEPTH - 1;

  return {
    ...descriptor,
    kind: "async",
    batch: 1,
    sanity: async () => (await container.resolveAsync(leafToken)) === expectedLeafValue,
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

function buildAsyncDiamondSharedLeafScenario(): AsyncBenchScenario {
  const leafToken = token<number>("bench-cf-async-diamond-leaf");
  const leftToken = token<number>("bench-cf-async-diamond-left");
  const rightToken = token<number>("bench-cf-async-diamond-right");
  const rootToken = token<number>("bench-cf-async-diamond-root");
  const container = Container.create();

  container
    .bind(leafToken)
    .toDynamicAsync(async () => {
      await Promise.resolve();

      return 1;
    })
    .transient();
  for (const siblingToken of [leftToken, rightToken]) {
    container
      .bind(siblingToken)
      .toDynamicAsync(async (resolutionContext) => (await resolutionContext.resolveAsync(leafToken)) + 1)
      .transient();
  }
  container
    .bind(rootToken)
    // Both requests are made before the await, so both siblings join the root's one cascade.
    .toDynamicAsync(async (resolutionContext) => {
      const [left, right] = await Promise.all([
        resolutionContext.resolveAsync(leftToken),
        resolutionContext.resolveAsync(rightToken),
      ]);

      return left + right;
    })
    .transient();

  const expectedRootValue = 4;

  return {
    ...ASYNC_DIAMOND_SHARED_LEAF,
    kind: "async",
    batch: 1,
    sanity: async () => (await container.resolveAsync(rootToken)) === expectedRootValue,
    build: () => {
      return async () => {
        const value = await container.resolveAsync(rootToken);

        if (value !== expectedRootValue) {
          throw new Error(`Expected async diamond root value ${String(expectedRootValue)}, received ${String(value)}`);
        }
      };
    },
  };
}

export function buildCodefastAsyncLaneScenarios(): ReadonlyArray<AsyncBenchScenario> {
  return [
    buildAsyncChainScenario(ASYNC_BRANCH_CHAIN, () => true),
    buildAsyncChainScenario(ASYNC_BRANCH_ESCAPE_MID_CHAIN, (level) => level === MID_CHAIN_ESCAPE_LEVEL),
    buildAsyncDiamondSharedLeafScenario(),
  ];
}
