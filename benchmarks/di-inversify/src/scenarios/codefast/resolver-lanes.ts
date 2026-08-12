/**
 * @codefast/di — two engine lanes taken when the fast shape does not apply (codefast-only).
 *
 * The first pair is the sync context pool's lending protocol. A resolve borrows one pooled path/stack
 * pair per resolver, and an empty root stack is the whole protocol: a factory that asks its own
 * `ResolutionContext` keeps using the borrowed pair, while a factory that calls `container.resolve()`
 * arrives with the pair still held and has to mint its own. Both rows do the same work per iteration —
 * one outer transient factory, one constant dependency — so the gap between them is that mint. The
 * pool is the top entry in this package's profile of its thinnest rows, and nothing measured its miss.
 *
 * `accessor-injection-construct` is the third injection channel. A constructor parameter and a
 * `toResolved` descriptor are one shape the plan compiler understands; an `@inject` accessor is not —
 * it resolves from the ambient container while the instance initialises, which also declines the
 * class's plan outright.
 */
import { Container, inject, injectable, token } from "@codefast/di";

import type { ScenarioDescriptor } from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

const RESOLVER_LANE_BATCH = 300;

const NESTED_CONTEXT_RESOLVE = {
  id: "nested-context-resolve-in-factory",
  group: "resolution",
  what: "resolve a transient factory that asks its ResolutionContext for one constant — the borrowed pooled path/stack pair (codefast-only)",
} as const satisfies ScenarioDescriptor;

const NESTED_CONTAINER_RESOLVE = {
  id: "nested-container-resolve-in-factory",
  group: "resolution",
  what: "the same factory calling container.resolve() instead — the pooled pair is already held, so the nested resolve mints its own (codefast-only)",
} as const satisfies ScenarioDescriptor;

const ACCESSOR_INJECTION_CONSTRUCT = {
  id: "accessor-injection-construct",
  group: "resolution",
  what: "resolve a transient class with one @inject accessor — the ambient-container channel, whose presence declines the class's plan (codefast-only)",
} as const satisfies ScenarioDescriptor;

interface LaneDependency {
  readonly id: string;
}

function buildFactoryResolveScenario(descriptor: ScenarioDescriptor, viaContainer: boolean): BenchScenario {
  const dependencyToken = token<LaneDependency>(`bench-cf-${descriptor.id}-dep`);
  const factoryToken = token<LaneDependency>(`bench-cf-${descriptor.id}-factory`);
  const container = Container.create();

  container.bind(dependencyToken).toConstantValue({ id: "dep" });
  container
    .bind(factoryToken)
    .toDynamic(
      viaContainer
        ? () => container.resolve(dependencyToken)
        : (resolutionContext) => resolutionContext.resolve(dependencyToken),
    )
    .transient();

  container.resolve(factoryToken);

  return {
    ...descriptor,
    batch: RESOLVER_LANE_BATCH,
    sanity: () => container.resolve(factoryToken).id === "dep",
    build: () =>
      batched(RESOLVER_LANE_BATCH, () => {
        container.resolve(factoryToken);
      }),
  };
}

const accessorDependencyToken = token<LaneDependency>("bench-cf-accessor-dep");

@injectable([])
class AccessorInjectedRoot {
  @inject(accessorDependencyToken) accessor dependency!: LaneDependency;
}

function buildAccessorInjectionScenario(): BenchScenario {
  const container = Container.create();

  container.bind(accessorDependencyToken).toConstantValue({ id: "dep" });
  container.bind(AccessorInjectedRoot).toSelf().transient();

  container.resolve(AccessorInjectedRoot);

  return {
    ...ACCESSOR_INJECTION_CONSTRUCT,
    batch: RESOLVER_LANE_BATCH,
    sanity: () => container.resolve(AccessorInjectedRoot).dependency.id === "dep",
    build: () =>
      batched(RESOLVER_LANE_BATCH, () => {
        container.resolve(AccessorInjectedRoot);
      }),
  };
}

export function buildCodefastResolverLaneScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildFactoryResolveScenario(NESTED_CONTEXT_RESOLVE, false),
    buildFactoryResolveScenario(NESTED_CONTAINER_RESOLVE, true),
    buildAccessorInjectionScenario(),
  ];
}
