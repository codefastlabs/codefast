/**
 * `@codefast/di` — two engine lanes taken when the fast shape does not apply .
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
import {
  ACCESSOR_INJECTION_CONSTRUCT,
  NESTED_CONTAINER_RESOLVE,
  NESTED_CONTEXT_RESOLVE,
  RESOLVER_LANE_BATCH,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

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

/**
 * @since 0.6.0
 */
export function buildCodefastResolverLaneScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildFactoryResolveScenario(NESTED_CONTEXT_RESOLVE, false),
    buildFactoryResolveScenario(NESTED_CONTAINER_RESOLVE, true),
    buildAccessorInjectionScenario(),
  ];
}
