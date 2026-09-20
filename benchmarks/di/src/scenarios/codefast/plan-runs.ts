/**
 * `@codefast/di` — what the generated tier costs and returns, run by run (codefast-only).
 *
 * A compiled plan runs as a closure until its `PLAN_CODEGEN_THRESHOLD`-th run, when it is generated
 * as a function of its own and replaces itself. Every other plan row is warm, so none of them can
 * see the numbers that decide whether that count is right: what generating costs, how long the
 * generated function takes to warm up — it is new code, where the closure's code is shared and
 * already hot — and what a warm generated run saves over a closure run. These rows resolve one class
 * chain from a fresh container exactly `k` times, with `k` a multiple of the threshold `T`, so the
 * difference between two rows is `k` runs of whichever tier those runs fell in — and the ids move
 * with the threshold, so a row never compares one count's ladder against another's:
 *
 *   `plan-runs-1` to `plan-runs-T/4`      closure runs, over the fixed cost `plan-runs-1` prices
 *   `plan-runs-T/2` to `plan-runs-T`      closure runs, plus one generation
 *   `plan-runs-T` to `plan-runs-2T`       generated runs, from cold
 *   `plan-runs-4T` to `plan-runs-8T`      generated runs, warm
 *   `plan-runs-deep-*`                    the same ladder over a 24-level chain
 *   `plan-runs-mixed-*`                   the 8-level ladder after six other plan shapes have run in
 *                                         the process, so the closure's shared call sites are polymorphic
 *
 * The bindings are made per op, so a row's fixed cost includes them; only the differences are read.
 */
import type { Token } from "@codefast/di";
import { Container, injectable, token } from "@codefast/di";
import { PLAN_CODEGEN_THRESHOLD } from "@codefast/di/resolution/plan/plan-codegen";

import type { ScenarioDescriptor } from "#fixtures/scenario-parity";
import type { BenchScenario } from "#scenarios/types";

const PLAN_RUNS_CHAIN_DEPTH = 8;
const PLAN_RUNS_DEEP_CHAIN_DEPTH = 24;
const THRESHOLD = PLAN_CODEGEN_THRESHOLD;
const PLAN_RUN_COUNTS = [1, THRESHOLD / 4, THRESHOLD / 2, THRESHOLD, THRESHOLD * 2, THRESHOLD * 4, THRESHOLD * 8];
const PLAN_RUNS_DEEP_COUNTS = [1, THRESHOLD / 4, THRESHOLD / 2, THRESHOLD, THRESHOLD * 2, THRESHOLD * 8];
const PLAN_RUNS_MIXED_COUNTS = [1, THRESHOLD / 2, THRESHOLD, THRESHOLD * 2, THRESHOLD * 8];
/** Below the threshold, so a polluting plan stays a closure and its runs land in the shared literals' feedback. */
const POLLUTION_RUNS = THRESHOLD / 2;

interface ChainNode {
  readonly value: number;
  readonly previous: ChainNode | undefined;
}

/**
 * One decorated class per level, hoisted: the row prices the plan's runs, not class creation. Each
 * level keeps its dependency, and the resolved leaf is kept below, so every instance escapes — an
 * inlined plan would otherwise have its allocations eliminated and price nothing.
 */
function buildChainLevelClass(previousToken: Token<ChainNode>): new (previous: ChainNode) => ChainNode {
  @injectable([previousToken])
  class ChainLevel implements ChainNode {
    readonly value: number;
    readonly previous: ChainNode;

    constructor(previous: ChainNode) {
      this.value = previous.value + 1;
      this.previous = previous;
    }
  }

  return ChainLevel;
}

/** The last leaf resolved, kept so the chain behind it is reachable and therefore allocated. */
let lastLeaf: ChainNode | undefined;

/** One chain's tokens and classes, built once; every op binds them into a fresh container. */
interface PlanRunsChain {
  readonly depth: number;
  readonly tokens: ReadonlyArray<Token<ChainNode>>;
  readonly classes: ReadonlyArray<new (previous: ChainNode) => ChainNode>;
}

function buildChain(depth: number, name: string): PlanRunsChain {
  const tokens = Array.from({ length: depth }, (_value, level) =>
    token<ChainNode>(`bench-cf-${name}-${String(level)}`),
  );
  const classes = tokens.slice(1).map((_token, index) => buildChainLevelClass(tokens[index]!));
  return { depth, tokens, classes };
}

function bindChain(chain: PlanRunsChain): Container {
  const container = Container.create();
  container.bind(chain.tokens[0]!).toConstantValue({ value: 0, previous: undefined });
  for (const [index, chainClass] of chain.classes.entries()) {
    container
      .bind(chain.tokens[index + 1]!)
      .to(chainClass)
      .transient();
  }
  return container;
}

interface Leaf {
  readonly id: number;
}

/** Six plan shapes other than a class chain, each resolved from a child so a scoped leaf has a scope. */
const POLLUTING_SHAPES: ReadonlyArray<() => void> = [
  () => {
    const leaf = token<Leaf>("bench-cf-plan-runs-pollute-factory");
    const root = token<Leaf>("bench-cf-plan-runs-pollute-factory-root");
    @injectable([leaf])
    class FactoryRoot implements Leaf {
      readonly id: number;
      constructor(dep: Leaf) {
        this.id = dep.id;
      }
    }
    const container = Container.create();
    container
      .bind(leaf)
      .toDynamic(() => ({ id: 1 }))
      .transient();
    container.bind(root).to(FactoryRoot).transient();
    runPolluter(container.createChild(), root);
  },
  () => {
    const leaf = token<Leaf>("bench-cf-plan-runs-pollute-scoped");
    const root = token<Leaf>("bench-cf-plan-runs-pollute-scoped-root");
    class ScopedLeaf implements Leaf {
      readonly id = 1;
    }
    @injectable([leaf])
    class ScopedRoot implements Leaf {
      readonly id: number;
      constructor(dep: Leaf) {
        this.id = dep.id;
      }
    }
    const container = Container.create();
    container.bind(leaf).to(ScopedLeaf).scoped();
    container.bind(root).to(ScopedRoot).transient();
    runPolluter(container.createChild(), root);
  },
  () => {
    const leaf = token<Leaf>("bench-cf-plan-runs-pollute-hooked");
    const root = token<Leaf>("bench-cf-plan-runs-pollute-hooked-root");
    class HookedLeaf implements Leaf {
      readonly id = 1;
    }
    @injectable([leaf])
    class HookedRoot implements Leaf {
      readonly id: number;
      constructor(dep: Leaf) {
        this.id = dep.id;
      }
    }
    const container = Container.create();
    container
      .bind(leaf)
      .to(HookedLeaf)
      .transient()
      .onActivation((_context, instance) => instance);
    container.bind(root).to(HookedRoot).transient();
    runPolluter(container.createChild(), root);
  },
  () => {
    const left = token<number>("bench-cf-plan-runs-pollute-resolved-left");
    const right = token<number>("bench-cf-plan-runs-pollute-resolved-right");
    const root = token<Leaf>("bench-cf-plan-runs-pollute-resolved-root");
    const container = Container.create();
    container.bind(left).toConstantValue(1);
    container.bind(right).toConstantValue(2);
    container
      .bind(root)
      .toResolved((a: number, b: number) => ({ id: a + b }), [left, right])
      .transient();
    runPolluter(container.createChild(), root);
  },
  () => {
    const first = token<Leaf>("bench-cf-plan-runs-pollute-fanout-1");
    const second = token<Leaf>("bench-cf-plan-runs-pollute-fanout-2");
    const third = token<Leaf>("bench-cf-plan-runs-pollute-fanout-3");
    const root = token<Leaf>("bench-cf-plan-runs-pollute-fanout-root");
    class FanLeaf implements Leaf {
      readonly id = 1;
    }
    @injectable([first, second, third])
    class FanRoot implements Leaf {
      readonly id: number;
      constructor(a: Leaf, b: Leaf, c: Leaf) {
        this.id = a.id + b.id + c.id;
      }
    }
    const container = Container.create();
    container.bind(first).to(FanLeaf).transient();
    container.bind(second).to(FanLeaf).transient();
    container.bind(third).to(FanLeaf).transient();
    container.bind(root).to(FanRoot).transient();
    runPolluter(container.createChild(), root);
  },
  () => {
    const leaf = token<Leaf>("bench-cf-plan-runs-pollute-constant");
    const root = token<Leaf>("bench-cf-plan-runs-pollute-constant-root");
    @injectable([leaf])
    class ConstantRoot implements Leaf {
      readonly id: number;
      constructor(dep: Leaf) {
        this.id = dep.id;
      }
    }
    const container = Container.create();
    container.bind(leaf).toConstantValue({ id: 1 });
    container.bind(root).to(ConstantRoot).transient();
    runPolluter(container.createChild(), root);
  },
];

function runPolluter(container: Container, root: Token<Leaf>): void {
  for (let run = 0; run < POLLUTION_RUNS; run += 1) {
    container.resolve(root);
  }
}

function buildPlanRunsScenario(
  descriptor: ScenarioDescriptor,
  chain: PlanRunsChain,
  runs: number,
  pollutes: boolean,
): BenchScenario {
  const leafToken = chain.tokens[chain.depth - 1]!;
  const expectedLeafValue = chain.depth - 1;

  return {
    ...descriptor,
    batch: 1,
    sanity: () => {
      const container = bindChain(chain);
      let last: ChainNode | undefined;
      for (let run = 0; run < runs; run += 1) {
        last = container.resolve(leafToken);
      }
      return last?.value === expectedLeafValue;
    },
    build: () => {
      if (pollutes) {
        for (const pollute of POLLUTING_SHAPES) {
          pollute();
        }
      }
      return () => {
        const container = bindChain(chain);
        for (let run = 0; run < runs; run += 1) {
          lastLeaf = container.resolve(leafToken);
        }
        if (lastLeaf?.value !== expectedLeafValue) {
          throw new Error(`plan-runs: expected ${String(expectedLeafValue)}, received ${String(lastLeaf?.value)}`);
        }
      };
    },
  };
}

/**
 * @since 0.10.0
 */
export function buildCodefastPlanRunsScenarios(): ReadonlyArray<BenchScenario> {
  const chain = buildChain(PLAN_RUNS_CHAIN_DEPTH, "plan-runs");
  const deepChain = buildChain(PLAN_RUNS_DEEP_CHAIN_DEPTH, "plan-runs-deep");
  return [
    ...PLAN_RUN_COUNTS.map((runs) =>
      buildPlanRunsScenario(
        {
          id: `plan-runs-${String(runs)}`,
          tier: "engine",
          requires: ["decorators", "transient"],
          facets: ["plan"],
          group: "resolution",
          what: `a fresh container resolving an ${String(PLAN_RUNS_CHAIN_DEPTH)}-level transient class chain exactly ${String(runs)} times — the plan's tiers priced run by run (codefast-only)`,
        },
        chain,
        runs,
        false,
      ),
    ),
    ...PLAN_RUNS_DEEP_COUNTS.map((runs) =>
      buildPlanRunsScenario(
        {
          id: `plan-runs-deep-${String(runs)}`,
          tier: "engine",
          requires: ["decorators", "transient"],
          facets: ["plan"],
          group: "resolution",
          what: `the same ladder over a ${String(PLAN_RUNS_DEEP_CHAIN_DEPTH)}-level chain, ${String(runs)} times (codefast-only)`,
        },
        deepChain,
        runs,
        false,
      ),
    ),
    ...PLAN_RUNS_MIXED_COUNTS.map((runs) =>
      buildPlanRunsScenario(
        {
          id: `plan-runs-mixed-${String(runs)}`,
          tier: "engine",
          requires: ["decorators", "transient"],
          facets: ["plan"],
          group: "resolution",
          what: `the ${String(PLAN_RUNS_CHAIN_DEPTH)}-level ladder, ${String(runs)} times, after six other plan shapes have run below the threshold in this process (codefast-only)`,
        },
        chain,
        runs,
        true,
      ),
    ),
  ];
}
