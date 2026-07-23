/**
 * InversifyJS 8 — binding variant scenarios. Parallel to
 * {@link ../codefast/binding-variants.ts}.
 *
 * Inversify mapping:
 *   - `toResolved(factory, deps)` → `toResolvedValue(factory, [id, id, id])`
 *   - `toAlias(target)` → `toService(serviceId)` (returns void — no chain)
 *   - `toSelf().singleton()` → `toSelf().inSingletonScope()`
 */
import "reflect-metadata";
import { Container, injectable } from "inversify";

import {
  TO_ALIAS_BATCH,
  TO_ALIAS_REDIRECT,
  TO_RESOLVED_3_DEPS,
  TO_RESOLVED_BATCH,
  TO_SELF_BATCH,
  TO_SELF_BINDING,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

// ─── scenario 1: toResolvedValue explicit deps ────────────────────────────────

interface ResolvedDep {
  readonly id: string;
}

interface ResolvedService {
  readonly a: ResolvedDep;
  readonly b: ResolvedDep;
  readonly c: ResolvedDep;
}

const depAId = Symbol("bench-inv-bv-dep-a");
const depBId = Symbol("bench-inv-bv-dep-b");
const depCId = Symbol("bench-inv-bv-dep-c");
const resolvedServiceId = Symbol("bench-inv-bv-resolved-service");

function buildToResolvedThreeDepsScenario(): BenchScenario {
  const container = new Container();

  container.bind<ResolvedDep>(depAId).toConstantValue({ id: "a" });
  container.bind<ResolvedDep>(depBId).toConstantValue({ id: "b" });
  container.bind<ResolvedDep>(depCId).toConstantValue({ id: "c" });

  container
    .bind<ResolvedService>(resolvedServiceId)
    .toResolvedValue(
      (a: ResolvedDep, b: ResolvedDep, c: ResolvedDep): ResolvedService => ({ a, b, c }),
      [depAId, depBId, depCId],
    )
    .inSingletonScope();

  const prewarmed = container.get<ResolvedService>(resolvedServiceId);

  return {
    ...TO_RESOLVED_3_DEPS,
    // inversify-specific wording — the shared descriptor supplies the paired id/group
    what: "resolve singleton bound via toResolvedValue() with 3 explicit dep identifiers (cache hit)",
    batch: TO_RESOLVED_BATCH,
    sanity: () => {
      const result = container.get<ResolvedService>(resolvedServiceId);
      return result === prewarmed && result.a.id === "a" && result.b.id === "b";
    },
    build: () =>
      batched(TO_RESOLVED_BATCH, () => {
        container.get(resolvedServiceId);
      }),
  };
}

// ─── scenario 2: toService redirect ──────────────────────────────────────────

interface AbstractService {
  readonly name: string;
}

const concreteId = Symbol("bench-inv-bv-concrete");
const abstractId = Symbol("bench-inv-bv-abstract");

function buildToServiceRedirectScenario(): BenchScenario {
  const container = new Container();

  container
    .bind<AbstractService>(concreteId)
    .toDynamicValue(() => ({ name: "concrete" }))
    .inSingletonScope();
  // toService returns void — no scope chain; scope comes from the target binding
  container.bind<AbstractService>(abstractId).toService(concreteId);

  const prewarmed = container.get<AbstractService>(abstractId);

  return {
    ...TO_ALIAS_REDIRECT,
    what: "resolve a toService() binding that redirects to a cached singleton (alias chain hit)",
    batch: TO_ALIAS_BATCH,
    sanity: () => {
      const viaAlias = container.get<AbstractService>(abstractId);
      const viaConcrete = container.get<AbstractService>(concreteId);
      return viaAlias === viaConcrete && viaAlias === prewarmed;
    },
    build: () =>
      batched(TO_ALIAS_BATCH, () => {
        container.get(abstractId);
      }),
  };
}

// ─── scenario 3: toSelf singleton ─────────────────────────────────────────────

@injectable()
class SelfBoundLeaf {
  readonly tag = "self-bound-leaf";
}

@injectable()
class SelfBoundRoot {
  readonly leaf: SelfBoundLeaf;
  readonly tag = "self-bound-root";

  constructor() {
    this.leaf = new SelfBoundLeaf();
  }
}

function buildToSelfSingletonScenario(): BenchScenario {
  const container = new Container();

  container.bind(SelfBoundLeaf).toSelf().inSingletonScope();
  container.bind(SelfBoundRoot).toSelf().inSingletonScope();

  const prewarmed = container.get(SelfBoundRoot);

  return {
    ...TO_SELF_BINDING,
    what: "resolve singleton bound via toSelf() — class constructor is the identifier (cache hit)",
    batch: TO_SELF_BATCH,
    sanity: () => {
      const result = container.get(SelfBoundRoot);
      return result === prewarmed && result.tag === "self-bound-root";
    },
    build: () =>
      batched(TO_SELF_BATCH, () => {
        container.get(SelfBoundRoot);
      }),
  };
}

/**
 * @since 0.3.16-canary.0
 */
export function buildInversifyBindingVariantScenarios(): ReadonlyArray<BenchScenario> {
  return [buildToResolvedThreeDepsScenario(), buildToServiceRedirectScenario(), buildToSelfSingletonScenario()];
}
