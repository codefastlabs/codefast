/**
 * Awilix — scope benchmarks. Parallel to `../codefast/scope.ts`.
 *
 *   - `child-depth-2-resolve`: a root registration resolved from a grandchild scope, walking
 *     the scope chain the way di, inversify, ditox and injection-js walk their parents.
 *   - `child-request-lifecycle-create-resolve-dispose`: two nested scopes per request, the
 *     request's own registrations on the first, resolve from the second, then `dispose()` both.
 *   - `scoped-binding-per-child`: a `scoped`-lifetime registration is shared within one
 *     `createScope()` and fresh across scopes. Awilix has a native per-scope lifetime, so the
 *     registration is declared once on the root and each request only creates a fresh scope —
 *     the same "bind once" shape as di's `.scoped()`.
 */
import { asFunction, asValue, createContainer } from "awilix";

import {
  CHILD_DEPTH_2_RESOLVE,
  CHILD_REQUEST_LIFECYCLE_CREATE_RESOLVE_DISPOSE,
  CHILD_RESOLVE_BATCH,
  REQUEST_LIFECYCLE_BATCH,
  SCOPED_BINDING_PER_CHILD,
  SCOPED_PER_CHILD_BATCH,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

function buildChildDepthTwoResolveScenario(): BenchScenario {
  const rootContainer = createContainer();
  rootContainer.register({ leaf: asValue(42) });
  const firstLevelScope = rootContainer.createScope();
  const secondLevelScope = firstLevelScope.createScope();
  secondLevelScope.resolve<number>("leaf");

  return {
    ...CHILD_DEPTH_2_RESOLVE,
    what: "resolve a root registration from a depth-2 createScope() chain (realistic per-request shape)",
    batch: CHILD_RESOLVE_BATCH,
    sanity: () => secondLevelScope.resolve<number>("leaf") === 42,
    build: () =>
      batched(CHILD_RESOLVE_BATCH, () => {
        secondLevelScope.resolve<number>("leaf");
      }),
  };
}

interface ScopeResolvedPayload {
  readonly appValue: number;
  readonly childValue: number;
}

interface RequestCradle {
  readonly appRoot: number;
  readonly childRequest: number;
  readonly payload: ScopeResolvedPayload;
}

function buildChildRequestLifecycleCreateResolveDisposeScenario(): BenchScenario {
  const appContainer = createContainer<Pick<RequestCradle, "appRoot">>();
  appContainer.register({ appRoot: asFunction((): number => 41).transient() });

  function runOneRequestLifecycle(): ScopeResolvedPayload {
    const firstLevelScope = appContainer.createScope<RequestCradle>();
    const secondLevelScope = firstLevelScope.createScope<RequestCradle>();

    firstLevelScope.register({
      childRequest: asFunction((): number => 1).transient(),
      payload: asFunction(({ appRoot, childRequest }: RequestCradle): ScopeResolvedPayload => ({
        appValue: appRoot,
        childValue: childRequest,
      })).transient(),
    });

    const resolvedPayload = secondLevelScope.resolve<ScopeResolvedPayload>("payload");
    void firstLevelScope.dispose();
    void secondLevelScope.dispose();
    return resolvedPayload;
  }

  return {
    ...CHILD_REQUEST_LIFECYCLE_CREATE_RESOLVE_DISPOSE,
    what: "create two nested per-request scopes, register on the first, resolve from the second, then dispose() both",
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

interface ScopedInstance {
  readonly id: number;
}

function buildScopedBindingPerChildScenario(): BenchScenario {
  let instanceCounter = 0;
  const rootContainer = createContainer();
  rootContainer.register({
    scopedInstance: asFunction((): ScopedInstance => ({ id: ++instanceCounter })).scoped(),
  });

  function runOneScopedRequest(): ScopedInstance {
    const scope = rootContainer.createScope();
    const first = scope.resolve<ScopedInstance>("scopedInstance");
    const second = scope.resolve<ScopedInstance>("scopedInstance");
    if (first !== second) {
      throw new Error("Expected scoped registration to return same instance within scope");
    }
    return first;
  }

  // Pre-warm
  runOneScopedRequest();

  return {
    ...SCOPED_BINDING_PER_CHILD,
    what: "createScope() + asFunction().scoped() — awilix's native per-scope lifetime (bind once)",
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
 * Builds Awilix's scope benchmark scenarios.
 */
export function buildAwilixScopeScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildChildDepthTwoResolveScenario(),
    buildChildRequestLifecycleCreateResolveDisposeScenario(),
    buildScopedBindingPerChildScenario(),
  ];
}
