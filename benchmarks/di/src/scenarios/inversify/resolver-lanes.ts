/**
 * InversifyJS 8 — a transient factory resolving one constant through its resolution context, then
 * through the container directly, and a class with one property-injected dependency.
 */
import "reflect-metadata";
import { Container, inject, injectable } from "inversify";

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
  const dependencyIdentifier = Symbol(`bench-inv-${descriptor.id}-dep`);
  const factoryIdentifier = Symbol(`bench-inv-${descriptor.id}-factory`);
  const container = new Container({ jitless: false });
  container.bind<LaneDependency>(dependencyIdentifier).toConstantValue({ id: "dep" });
  container
    .bind<LaneDependency>(factoryIdentifier)
    .toDynamicValue(
      viaContainer
        ? () => container.get<LaneDependency>(dependencyIdentifier)
        : (resolutionContext) => resolutionContext.get<LaneDependency>(dependencyIdentifier),
    )
    .inTransientScope();
  container.get(factoryIdentifier);

  return {
    ...descriptor,
    what: viaContainer
      ? "the same transient toDynamicValue() factory calling container.get() directly"
      : "get() a transient toDynamicValue() factory that asks its ResolutionContext for one constant",
    batch: RESOLVER_LANE_BATCH,
    sanity: () => container.get<LaneDependency>(factoryIdentifier).id === "dep",
    build: () =>
      batched(RESOLVER_LANE_BATCH, () => {
        container.get(factoryIdentifier);
      }),
  };
}

const propertyDependencyIdentifier = Symbol("bench-inv-property-dep");

@injectable()
class PropertyInjectedRoot {
  // @ts-ignore reflect-metadata + explicit token injection
  @inject(propertyDependencyIdentifier)
  dependency!: LaneDependency;
}

function buildPropertyInjectionScenario(): BenchScenario {
  const container = new Container({ jitless: false });
  container.bind<LaneDependency>(propertyDependencyIdentifier).toConstantValue({ id: "dep" });
  container.bind(PropertyInjectedRoot).toSelf().inTransientScope();
  container.get(PropertyInjectedRoot);

  return {
    ...ACCESSOR_INJECTION_CONSTRUCT,
    what: "get() a transient class with one @inject property",
    batch: RESOLVER_LANE_BATCH,
    sanity: () => container.get(PropertyInjectedRoot).dependency.id === "dep",
    build: () =>
      batched(RESOLVER_LANE_BATCH, () => {
        container.get(PropertyInjectedRoot);
      }),
  };
}

/**
 * Builds inversify's resolver-lane scenarios.
 */
export function buildInversifyResolverLaneScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildFactoryResolveScenario(NESTED_CONTEXT_RESOLVE, false),
    buildFactoryResolveScenario(NESTED_CONTAINER_RESOLVE, true),
    buildPropertyInjectionScenario(),
  ];
}
