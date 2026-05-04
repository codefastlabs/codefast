/**
 * @codefast/di — binding variant scenarios.
 *
 * Exercises three binding APIs that have no coverage elsewhere:
 *
 *   - `to-resolved-3-deps` — `toResolved(factory, deps)` with three singleton
 *     dependencies declared explicitly via the deps tuple.  Parallels `toDynamic`
 *     with `ctx.resolve()` but uses the compiler-verified explicit-deps path.
 *     Hot: all three deps are singletons already cached; measures the resolve loop
 *     over a pre-declared deps array vs the opaque `toDynamic` closure.
 *
 *   - `to-alias-redirect` — `toAlias(target)` binding that forwards resolution to
 *     a concrete singleton.  Models the interface → implementation pointer used
 *     across every layer boundary in production apps.  Hot after warmup: alias
 *     resolve chain hit from cache.
 *
 *   - `to-self-binding` — `toSelf().singleton()` on an `@injectable()` class.
 *     The token is the class constructor itself; measures the self-binding path
 *     as a singleton cache hit after the first resolve.
 */
import { Container, injectable, token } from "@codefast/di";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

// ─── scenario 1: toResolved explicit deps ─────────────────────────────────────

const TO_RESOLVED_BATCH = 200;

interface ResolvedDep {
  readonly id: string;
}

interface ResolvedService {
  readonly a: ResolvedDep;
  readonly b: ResolvedDep;
  readonly c: ResolvedDep;
}

const depAToken = token<ResolvedDep>("bench-cf-bv-dep-a");
const depBToken = token<ResolvedDep>("bench-cf-bv-dep-b");
const depCToken = token<ResolvedDep>("bench-cf-bv-dep-c");
const resolvedServiceToken = token<ResolvedService>("bench-cf-bv-resolved-service");

function buildToResolvedThreeDepsScenario(): BenchScenario {
  const container = Container.create();

  container.bind(depAToken).toConstantValue({ id: "a" });
  container.bind(depBToken).toConstantValue({ id: "b" });
  container.bind(depCToken).toConstantValue({ id: "c" });

  container
    .bind(resolvedServiceToken)
    .toResolved((a, b, c): ResolvedService => ({ a, b, c }), [
      depAToken,
      depBToken,
      depCToken,
    ] as const)
    .singleton();

  const prewarmed = container.resolve(resolvedServiceToken);

  return {
    id: "to-resolved-3-deps",
    group: "micro",
    what: "resolve singleton bound via toResolved() with 3 explicit dep tokens (cache hit)",
    batch: TO_RESOLVED_BATCH,
    sanity: () => {
      const result = container.resolve(resolvedServiceToken);
      return result === prewarmed && result.a.id === "a" && result.b.id === "b";
    },
    build: () =>
      batched(TO_RESOLVED_BATCH, () => {
        container.resolve(resolvedServiceToken);
      }),
  };
}

// ─── scenario 2: toAlias redirect ────────────────────────────────────────────

const TO_ALIAS_BATCH = 500;

interface AbstractService {
  readonly name: string;
}

const concreteToken = token<AbstractService>("bench-cf-bv-concrete");
const abstractToken = token<AbstractService>("bench-cf-bv-abstract");

function buildToAliasRedirectScenario(): BenchScenario {
  const container = Container.create();

  container
    .bind(concreteToken)
    .toDynamic(() => ({ name: "concrete" }))
    .singleton();
  container.bind(abstractToken).toAlias(concreteToken);

  const prewarmed = container.resolve(abstractToken);

  return {
    id: "to-alias-redirect",
    group: "micro",
    what: "resolve a toAlias() binding that redirects to a cached singleton (alias chain hit)",
    batch: TO_ALIAS_BATCH,
    sanity: () => {
      const viaAlias = container.resolve(abstractToken);
      const viaConcrete = container.resolve(concreteToken);
      return viaAlias === viaConcrete && viaAlias === prewarmed;
    },
    build: () =>
      batched(TO_ALIAS_BATCH, () => {
        container.resolve(abstractToken);
      }),
  };
}

// ─── scenario 3: toSelf singleton ─────────────────────────────────────────────

const TO_SELF_BATCH = 300;

@injectable()
class SelfBoundLeaf {
  readonly tag = "self-bound-leaf";
}

@injectable([SelfBoundLeaf])
class SelfBoundRoot {
  constructor(readonly leaf: SelfBoundLeaf) {}
  readonly tag = "self-bound-root";
}

function buildToSelfSingletonScenario(): BenchScenario {
  const container = Container.create();

  container.bind(SelfBoundLeaf).toSelf().singleton();
  container.bind(SelfBoundRoot).toSelf().singleton();

  const prewarmed = container.resolve(SelfBoundRoot);

  return {
    id: "to-self-binding",
    group: "micro",
    what: "resolve singleton bound via toSelf() — class constructor is the token (cache hit)",
    batch: TO_SELF_BATCH,
    sanity: () => {
      const result = container.resolve(SelfBoundRoot);
      return result === prewarmed && result.tag === "self-bound-root";
    },
    build: () =>
      batched(TO_SELF_BATCH, () => {
        container.resolve(SelfBoundRoot);
      }),
  };
}

/**
 * @since 0.3.16-canary.0
 */
export function buildCodefastBindingVariantScenarios(): readonly BenchScenario[] {
  return [
    buildToResolvedThreeDepsScenario(),
    buildToAliasRedirectScenario(),
    buildToSelfSingletonScenario(),
  ];
}
