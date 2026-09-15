/**
 * injection-js — the explicit-deps and self-binding rows: a factory provider with three declared
 * deps, the realistic graph in the same form (its adapter already is), and a class provided as its
 * own token.
 */
import "reflect-metadata";
import type { ResolvedReflectiveProvider } from "injection-js";
import { Inject, Injectable, InjectionToken, ReflectiveInjector } from "injection-js";

import { buildInjectionJsRealisticInjector } from "#/fixtures/injection-js-adapter";
import { REALISTIC_GRAPH } from "#/fixtures/realistic-graph";
import type { RealisticNode } from "#/fixtures/realistic-graph";
import {
  REALISTIC_GRAPH_RESOLVED_ROOT,
  REALISTIC_RESOLVE_BATCH,
  TO_RESOLVED_3_DEPS,
  TO_RESOLVED_BATCH,
  TO_SELF_BATCH,
  TO_SELF_BINDING,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

interface ResolvedDep {
  readonly id: string;
}

interface ResolvedService {
  readonly a: ResolvedDep;
  readonly b: ResolvedDep;
  readonly c: ResolvedDep;
}

const DEP_A = new InjectionToken<ResolvedDep>("bench-injection-js-bv-dep-a");
const DEP_B = new InjectionToken<ResolvedDep>("bench-injection-js-bv-dep-b");
const DEP_C = new InjectionToken<ResolvedDep>("bench-injection-js-bv-dep-c");
const RESOLVED_SERVICE = new InjectionToken<ResolvedService>("bench-injection-js-bv-resolved-service");

function buildToResolvedThreeDepsScenario(): BenchScenario {
  const injector = ReflectiveInjector.resolveAndCreate([
    { provide: DEP_A, useValue: { id: "a" } },
    { provide: DEP_B, useValue: { id: "b" } },
    { provide: DEP_C, useValue: { id: "c" } },
    {
      provide: RESOLVED_SERVICE,
      useFactory: (a: ResolvedDep, b: ResolvedDep, c: ResolvedDep): ResolvedService => ({ a, b, c }),
      deps: [DEP_A, DEP_B, DEP_C],
    },
  ]);
  const prewarmed = injector.get(RESOLVED_SERVICE) as ResolvedService;

  return {
    ...TO_RESOLVED_3_DEPS,
    what: "get() a factory provider with 3 declared deps, cached per injector (cache hit)",
    batch: TO_RESOLVED_BATCH,
    sanity: () => {
      const result = injector.get(RESOLVED_SERVICE) as ResolvedService;
      return result === prewarmed && result.a.id === "a" && result.b.id === "b";
    },
    build: () =>
      batched(TO_RESOLVED_BATCH, () => {
        injector.get(RESOLVED_SERVICE);
      }),
  };
}

function buildRealisticGraphResolvedRootScenario(): BenchScenario {
  const { injector, resolvedRootProvider } = buildInjectionJsRealisticInjector(REALISTIC_GRAPH);
  const instantiate = (provider: ResolvedReflectiveProvider): RealisticNode =>
    injector.instantiateResolved(provider) as RealisticNode;
  instantiate(resolvedRootProvider);

  return {
    ...REALISTIC_GRAPH_RESOLVED_ROOT,
    // Every injection-js factory provider declares its deps, so this is its resolve-root row again.
    what: "instantiateResolved() the transient root of the 10-node graph over factory providers with declared deps (injection-js's only factory form)",
    batch: REALISTIC_RESOLVE_BATCH,
    sanity: () => {
      const resolved = instantiate(resolvedRootProvider);
      return resolved.__id === REALISTIC_GRAPH.rootId && resolved.resolvedDependencies.length === 3;
    },
    build: () =>
      batched(REALISTIC_RESOLVE_BATCH, () => {
        injector.instantiateResolved(resolvedRootProvider);
      }),
  };
}

@Injectable()
class SelfBoundLeaf {
  readonly tag = "self-bound-leaf";
}

@Injectable()
class SelfBoundRoot {
  readonly tag = "self-bound-root";
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @Inject(SelfBoundLeaf)
    readonly leaf: SelfBoundLeaf,
  ) {}
}

function buildToSelfSingletonScenario(): BenchScenario {
  const injector = ReflectiveInjector.resolveAndCreate([SelfBoundLeaf, SelfBoundRoot]);
  const prewarmed = injector.get(SelfBoundRoot) as SelfBoundRoot;

  return {
    ...TO_SELF_BINDING,
    what: "get() a class provided as its own token — the constructor is the token, cached per injector (cache hit)",
    batch: TO_SELF_BATCH,
    sanity: () => {
      const result = injector.get(SelfBoundRoot) as SelfBoundRoot;
      return result === prewarmed && result.tag === "self-bound-root";
    },
    build: () =>
      batched(TO_SELF_BATCH, () => {
        injector.get(SelfBoundRoot);
      }),
  };
}

/**
 * Builds injection-js's binding-variant scenarios.
 *
 * @since 0.8.0
 */
export function buildInjectionJsBindingVariantScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildToResolvedThreeDepsScenario(),
    buildRealisticGraphResolvedRootScenario(),
    buildToSelfSingletonScenario(),
  ];
}
