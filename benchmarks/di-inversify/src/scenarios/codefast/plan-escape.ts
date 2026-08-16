/**
 * `@codefast/di` — what each kind of plan escape costs (codefast-only).
 *
 * A compiled plan is a nested-constructor closure with no per-resolve bookkeeping. A dependency the
 * compiler cannot see through does not sink the plan: it compiles to an escape — a re-entry into the
 * runtime resolver, seeded with the ancestors the interpreted path would have pushed, which copies an
 * ancestor path and a stack on every call. Several kinds of dependency reach that escape, and only
 * one of them (a name-carrying dependency, in `slot-selection.ts`) had a row.
 *
 * Five of the six rows resolve the same arity — one transient root class with four dependencies, each
 * leaf yielding the same value shape and rebuilt on every resolve — so the only thing that differs is
 * what makes the dependency opaque. `plan-deps-inlined` is the control: four transient class leaves
 * the compiler inlines, zero escapes.
 *
 * A transient-leaf row read against the control is the whole cost of that kind of dependency, four
 * times over — the escape **plus** what the escape then has to do, which is a hook dispatch, a
 * `resolveAll` or an optional lookup depending on the row. That is the reading those rows support;
 * isolating the escape alone would need a shape where the same dependency can be had both ways, and
 * only the named dependency in `slot-selection.ts` has one.
 *
 * `plan-escape-scoped-dep` is the exception the control cannot price: a scoped leaf is built once and
 * served from the scope cache after, so it pays four escapes but no per-resolve rebuild. Its number
 * is escape + cache hit, not the transient-leaf rows' escape + build, so it stays out of the
 * aggregates rather than being read beside them.
 */
import type { Constructor } from "@codefast/di";
import { Container, injectAll, injectable, optional, token } from "@codefast/di";

import type { ScenarioDescriptor } from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

const PLAN_RESOLVE_BATCH = 300;

interface EscapeLeaf {
  readonly id: string;
}

@injectable()
class PlanLeaf implements EscapeLeaf {
  readonly id = "leaf";
}

const alphaLeafToken = token<EscapeLeaf>("bench-cf-plan-escape-leaf-alpha");
const betaLeafToken = token<EscapeLeaf>("bench-cf-plan-escape-leaf-beta");
const gammaLeafToken = token<EscapeLeaf>("bench-cf-plan-escape-leaf-gamma");
const deltaLeafToken = token<EscapeLeaf>("bench-cf-plan-escape-leaf-delta");

const LEAF_TOKENS = [alphaLeafToken, betaLeafToken, gammaLeafToken, deltaLeafToken] as const;

@injectable([alphaLeafToken, betaLeafToken, gammaLeafToken, deltaLeafToken])
class PlainDepsRoot {
  constructor(
    readonly alpha: EscapeLeaf,
    readonly beta: EscapeLeaf,
    readonly gamma: EscapeLeaf,
    readonly delta: EscapeLeaf,
  ) {}
}

@injectable([optional(alphaLeafToken), optional(betaLeafToken), optional(gammaLeafToken), optional(deltaLeafToken)])
class OptionalDepsRoot {
  constructor(
    readonly alpha: EscapeLeaf | undefined,
    readonly beta: EscapeLeaf | undefined,
    readonly gamma: EscapeLeaf | undefined,
    readonly delta: EscapeLeaf | undefined,
  ) {}
}

@injectable([injectAll(alphaLeafToken), injectAll(betaLeafToken), injectAll(gammaLeafToken), injectAll(deltaLeafToken)])
class MultiDepsRoot {
  constructor(
    readonly alpha: Array<EscapeLeaf>,
    readonly beta: Array<EscapeLeaf>,
    readonly gamma: Array<EscapeLeaf>,
    readonly delta: Array<EscapeLeaf>,
  ) {}
}

/** How a row binds one leaf — the single axis the six rows vary. */
type BindLeaf = (container: Container, leafToken: (typeof LEAF_TOKENS)[number]) => void;

const bindInlinedLeaf: BindLeaf = (container, leafToken) => {
  container.bind(leafToken).to(PlanLeaf).transient();
};

const bindFactoryLeaf: BindLeaf = (container, leafToken) => {
  container
    .bind(leafToken)
    .toDynamic(() => ({ id: "leaf" }))
    .transient();
};

const bindScopedLeaf: BindLeaf = (container, leafToken) => {
  container.bind(leafToken).to(PlanLeaf).scoped();
};

const bindHookedLeaf: BindLeaf = (container, leafToken) => {
  container
    .bind(leafToken)
    .to(PlanLeaf)
    .transient()
    .onActivation((_context, instance) => instance);
};

/** Predicate-only, so `resolveAll` has a candidate to find: the default slot is last-wins. */
const bindMultiLeaf: BindLeaf = (container, leafToken) => {
  container
    .bind(leafToken)
    .to(PlanLeaf)
    .when(() => true)
    .transient();
};

function buildEscapeContainer<Root>(rootClass: Constructor<Root>, bindLeaf: BindLeaf): Container {
  // Every row resolves from a child, because a scoped binding needs one and the six shapes have to
  // stay identical apart from the leaf's binding kind. The child owns every binding either way.
  const container = Container.create().createChild();

  for (const leafToken of LEAF_TOKENS) {
    bindLeaf(container, leafToken);
  }
  container.bind(rootClass).toSelf().transient();

  return container;
}

function buildPlainDepsScenario(
  descriptor: ScenarioDescriptor,
  bindLeaf: BindLeaf,
  excludeFromAggregates = false,
): BenchScenario {
  const container = buildEscapeContainer(PlainDepsRoot, bindLeaf);

  container.resolve(PlainDepsRoot);

  return {
    ...descriptor,
    batch: PLAN_RESOLVE_BATCH,
    excludeFromAggregates,
    sanity: () => container.resolve(PlainDepsRoot).delta.id === "leaf",
    build: () =>
      batched(PLAN_RESOLVE_BATCH, () => {
        container.resolve(PlainDepsRoot);
      }),
  };
}

function buildOptionalDepsScenario(): BenchScenario {
  const container = buildEscapeContainer(OptionalDepsRoot, bindInlinedLeaf);

  container.resolve(OptionalDepsRoot);

  return {
    id: "plan-escape-optional-dep",
    group: "resolution",
    what: "resolve a 4-dep transient class whose every dependency is optional and bound — four escapes at optional arity (codefast-only)",
    batch: PLAN_RESOLVE_BATCH,
    // Bound, not missing: an optional miss is a different lane, and this row claims the hit.
    sanity: () => container.resolve(OptionalDepsRoot).delta?.id === "leaf",
    build: () =>
      batched(PLAN_RESOLVE_BATCH, () => {
        container.resolve(OptionalDepsRoot);
      }),
  };
}

function buildMultiDepsScenario(): BenchScenario {
  const container = buildEscapeContainer(MultiDepsRoot, bindMultiLeaf);

  container.resolve(MultiDepsRoot);

  return {
    id: "plan-escape-multi-dep",
    group: "resolution",
    what: "resolve a 4-dep transient class whose every dependency is injectAll — four escapes at all arity (codefast-only)",
    batch: PLAN_RESOLVE_BATCH,
    sanity: () => container.resolve(MultiDepsRoot).delta.length === 1,
    build: () =>
      batched(PLAN_RESOLVE_BATCH, () => {
        container.resolve(MultiDepsRoot);
      }),
  };
}

export function buildCodefastPlanEscapeScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildPlainDepsScenario(
      {
        id: "plan-deps-inlined",
        group: "resolution",
        what: "resolve a 4-dep transient class whose leaves are transient classes — the plan inlines all four, no escape (codefast-only)",
      },
      bindInlinedLeaf,
    ),
    buildPlainDepsScenario(
      {
        id: "plan-escape-factory-dep",
        group: "resolution",
        what: "the same class with toDynamic leaves — four escapes, one per opaque factory (codefast-only)",
      },
      bindFactoryLeaf,
    ),
    buildPlainDepsScenario(
      {
        id: "plan-escape-scoped-dep",
        group: "resolution",
        what: "the same class with scoped leaves served from a warm scope — four escapes, no per-resolve rebuild, held out of the aggregates (codefast-only)",
      },
      bindScopedLeaf,
      true,
    ),
    buildPlainDepsScenario(
      {
        id: "plan-escape-hooked-dep",
        group: "resolution",
        what: "the same class with leaves carrying .onActivation() — four escapes, one per declined leaf plan (codefast-only)",
      },
      bindHookedLeaf,
    ),
    buildOptionalDepsScenario(),
    buildMultiDepsScenario(),
  ];
}
