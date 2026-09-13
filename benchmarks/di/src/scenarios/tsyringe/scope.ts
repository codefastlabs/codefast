/**
 * tsyringe — scope benchmarks. Parallel to `../codefast/scope.ts`.
 *
 *   - `child-depth-N-resolve`: an app-container registration resolved from a child N levels down,
 *     walking the parent chain the way the other hierarchical containers do.
 *   - `child-request-lifecycle-create-resolve-dispose`: two nested children per request, the
 *     request's own registrations on the first, resolve from the second, then `dispose()` both.
 *   - `scoped-binding-per-child`: a `ContainerScoped` class is shared within one child
 *     container and fresh across children. The registration lives once on the app
 *     container; each request only creates a fresh child — the same "bind once" shape as
 *     di's `.scoped()`. `ContainerScoped` requires a class provider, not a factory.
 */
import "reflect-metadata";
import { container as tsyringeRootContainer, injectable, Lifecycle } from "tsyringe";

import {
  CHILD_DEPTHS,
  CHILD_REQUEST_LIFECYCLE_CREATE_RESOLVE_DISPOSE,
  CHILD_RESOLVE_BATCH,
  childDepthResolveDescriptor,
  REQUEST_LIFECYCLE_BATCH,
  SCOPED_BINDING_PER_CHILD,
  SCOPED_PER_CHILD_BATCH,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

function buildChildDepthResolveScenario(depth: number): BenchScenario {
  const childScopeLeafToken = Symbol(`bench-tsyringe-child${String(depth)}-leaf`);
  const rootContainer = tsyringeRootContainer.createChildContainer();
  rootContainer.register<number>(childScopeLeafToken, { useValue: 42 });
  let deepestContainer = rootContainer;
  for (let level = 0; level < depth; level++) {
    deepestContainer = deepestContainer.createChildContainer();
  }
  deepestContainer.resolve<number>(childScopeLeafToken);

  return {
    ...childDepthResolveDescriptor(depth),
    what: `resolve an app registration from a depth-${String(depth)} createChildContainer() chain — the parent walk a per-request container pays`,
    batch: CHILD_RESOLVE_BATCH,
    sanity: () => deepestContainer.resolve<number>(childScopeLeafToken) === 42,
    build: () =>
      batched(CHILD_RESOLVE_BATCH, () => {
        deepestContainer.resolve<number>(childScopeLeafToken);
      }),
  };
}

interface ScopeResolvedPayload {
  readonly appValue: number;
  readonly childValue: number;
}

function buildChildRequestLifecycleCreateResolveDisposeScenario(): BenchScenario {
  const appRootServiceToken = Symbol("bench-tsyringe-scope-request-app-root");
  const childRequestServiceToken = Symbol("bench-tsyringe-scope-request-child");
  const resolvedPayloadToken = Symbol("bench-tsyringe-scope-request-payload");
  const appContainer = tsyringeRootContainer.createChildContainer();
  appContainer.register<number>(appRootServiceToken, { useFactory: () => 41 });

  function runOneRequestLifecycle(): ScopeResolvedPayload {
    const firstLevelChildContainer = appContainer.createChildContainer();
    const secondLevelChildContainer = firstLevelChildContainer.createChildContainer();

    firstLevelChildContainer.register<number>(childRequestServiceToken, { useFactory: () => 1 });
    firstLevelChildContainer.register<ScopeResolvedPayload>(resolvedPayloadToken, {
      useFactory: (dependencyContainer) => ({
        appValue: dependencyContainer.resolve<number>(appRootServiceToken),
        childValue: dependencyContainer.resolve<number>(childRequestServiceToken),
      }),
    });

    const resolvedPayload = secondLevelChildContainer.resolve<ScopeResolvedPayload>(resolvedPayloadToken);
    void firstLevelChildContainer.dispose();
    void secondLevelChildContainer.dispose();
    return resolvedPayload;
  }

  return {
    ...CHILD_REQUEST_LIFECYCLE_CREATE_RESOLVE_DISPOSE,
    what: "create two nested per-request children, register factories on the first, resolve from the second, then dispose() both",
    batch: REQUEST_LIFECYCLE_BATCH,
    sanity: () => {
      const resolvedPayload = runOneRequestLifecycle();
      return resolvedPayload.appValue === 41 && resolvedPayload.childValue === 1;
    },
    build: () =>
      batched(REQUEST_LIFECYCLE_BATCH, () => {
        runOneRequestLifecycle();
      }),
  };
}

let instanceCounter = 0;

@injectable()
class ScopedInstance {
  readonly id = ++instanceCounter;
}

function buildScopedBindingPerChildScenario(): BenchScenario {
  const appContainer = tsyringeRootContainer.createChildContainer();
  appContainer.register(ScopedInstance, { useClass: ScopedInstance }, { lifecycle: Lifecycle.ContainerScoped });

  function runOneScopedRequest(): ScopedInstance {
    const child = appContainer.createChildContainer();
    const first = child.resolve(ScopedInstance);
    const second = child.resolve(ScopedInstance);
    if (first !== second) {
      throw new Error("Expected ContainerScoped class to return same instance within child");
    }
    return first;
  }

  // Pre-warm
  runOneScopedRequest();

  return {
    ...SCOPED_BINDING_PER_CHILD,
    what: "createChildContainer() + ContainerScoped class — tsyringe's per-container lifetime (bind once)",
    batch: SCOPED_PER_CHILD_BATCH,
    sanity: () => {
      const first = runOneScopedRequest();
      const second = runOneScopedRequest();
      return first !== second && first.id < second.id;
    },
    build: () =>
      batched(SCOPED_PER_CHILD_BATCH, () => {
        runOneScopedRequest();
      }),
  };
}

/**
 * Builds tsyringe's scope benchmark scenarios.
 */
export function buildTsyringeScopeScenarios(): ReadonlyArray<BenchScenario> {
  return [
    ...CHILD_DEPTHS.map((depth) => buildChildDepthResolveScenario(depth)),
    buildChildRequestLifecycleCreateResolveDisposeScenario(),
    buildScopedBindingPerChildScenario(),
  ];
}
