/**
 * `@codefast/di` — a class chain at two depths, compiled and interpreted (codefast-only).
 *
 * `scale-mid-transient-chain-32` and `scale-deep-transient-chain-512` are `toDynamic` chains, so they
 * run the transient-dynamic lane: they never compile a plan. A **class** chain is the shape the plan
 * compiler inlines, and the interpreted lane pushes one frame per level. These four rows are a 2×2:
 *
 *                       shallow (24)                 deep (40)
 *   plan compiled       plan-class-chain-24          plan-class-chain-40
 *   plan declined       interpreted-class-chain-24   interpreted-class-chain-40
 *
 *   - across a row  → how each lane's cost scales with depth: a generated plan is one statement per
 *     level, the interpreted path one frame, one flag and one dispatch per level.
 *   - down a column → what the compiled plan is worth at that depth, since the only difference is an
 *     activation hook on the root, which declines the plan.
 *
 * Each level is its own decorated class, so every binding is `kind: "class"` and inlinable.
 */
import type { Token } from "@codefast/di";
import { Container, injectable, token } from "@codefast/di";

import type { ScenarioDescriptor } from "#fixtures/scenario-parity";
import type { BenchScenario } from "#scenarios/types";

const SHALLOW_CHAIN_DEPTH = 24;
const DEEP_CHAIN_DEPTH = 40;

interface ChainNode {
  readonly value: number;
}

/** One decorated class per level: a fresh class expression is what carries its own dep metadata. */
function buildChainLevelClass(previousToken: Token<ChainNode>): new (previous: ChainNode) => ChainNode {
  @injectable([previousToken])
  class ChainLevel implements ChainNode {
    readonly value: number;

    constructor(previous: ChainNode) {
      this.value = previous.value + 1;
    }
  }

  return ChainLevel;
}

function buildClassChainScenario(descriptor: ScenarioDescriptor, depth: number, declinePlan: boolean): BenchScenario {
  const chainTokens = Array.from({ length: depth }, (_value, level) =>
    token<ChainNode>(`bench-cf-${descriptor.id}-${String(level)}`),
  );
  const container = Container.create();

  container.bind(chainTokens[0]!).toConstantValue({ value: 0 });
  for (let level = 1; level < depth; level++) {
    const levelBinding = container
      .bind(chainTokens[level]!)
      .to(buildChainLevelClass(chainTokens[level - 1]!))
      .transient();

    // Only the resolved token's own plan is ever compiled, so the hook — the cheapest thing that
    // makes the compiler decline one — belongs on the last level, which is what the row resolves.
    if (declinePlan && level === depth - 1) {
      levelBinding.onActivation((_context, instance) => instance);
    }
  }

  const leafToken = chainTokens[depth - 1]!;
  const expectedLeafValue = depth - 1;

  container.resolve(leafToken);

  return {
    ...descriptor,
    batch: 1,
    sanity: () => container.resolve(leafToken).value === expectedLeafValue,
    build: () => {
      return () => {
        container.resolve(leafToken);
      };
    },
  };
}

/**
 * @since 0.6.0
 */
export function buildCodefastPlanDepthScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildClassChainScenario(
      {
        id: `plan-class-chain-${String(SHALLOW_CHAIN_DEPTH)}`,
        tier: "engine",
        requires: ["decorators", "transient"],
        facets: ["plan"],
        group: "resolution",
        what: `resolve a ${String(SHALLOW_CHAIN_DEPTH)}-level transient class chain — one generated plan runs the whole chain (codefast-only)`,
      },
      SHALLOW_CHAIN_DEPTH,
      false,
    ),
    buildClassChainScenario(
      {
        id: `plan-class-chain-${String(DEEP_CHAIN_DEPTH)}`,
        tier: "engine",
        requires: ["decorators", "transient"],
        facets: ["plan"],
        group: "resolution",
        what: `the same chain at ${String(DEEP_CHAIN_DEPTH)} levels — one generated plan, one statement per level (codefast-only)`,
      },
      DEEP_CHAIN_DEPTH,
      false,
    ),
    buildClassChainScenario(
      {
        id: `interpreted-class-chain-${String(SHALLOW_CHAIN_DEPTH)}`,
        tier: "engine",
        requires: ["decorators", "transient"],
        facets: ["plan"],
        group: "resolution",
        what: `the ${String(SHALLOW_CHAIN_DEPTH)}-level chain with the root's plan declined — the interpreted path, one frame and one flag per level (codefast-only)`,
      },
      SHALLOW_CHAIN_DEPTH,
      true,
    ),
    buildClassChainScenario(
      {
        id: `interpreted-class-chain-${String(DEEP_CHAIN_DEPTH)}`,
        tier: "engine",
        requires: ["decorators", "transient"],
        facets: ["plan"],
        group: "resolution",
        what: `the ${String(DEEP_CHAIN_DEPTH)}-level chain with the root's plan declined — the same interpreted path, deeper (codefast-only)`,
      },
      DEEP_CHAIN_DEPTH,
      true,
    ),
  ];
}
