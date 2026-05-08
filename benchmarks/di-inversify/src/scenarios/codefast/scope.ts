/**
 * @codefast/di — child-container scope scenarios.
 *
 * This package keeps only the production-shaped scope row:
 *   - `child-depth-2-resolve` — resolve from a grandchild.
 *     Shape: app container -> per-request child -> one nested child.
 */
import { Container, token } from "@codefast/di";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

const CHILD_RESOLVE_BATCH = 500;

const REQUEST_LIFECYCLE_BATCH = 100;

interface ScopeResolvedPayload {
  readonly appValue: number;
  readonly childValue: number;
}

function buildChildDepthTwoResolveScenario(): BenchScenario {
  const childScopeLeafToken = token<number>("bench-cf-child2-leaf");
  const rootContainer = Container.create();
  rootContainer.bind(childScopeLeafToken).toConstantValue(42);
  const firstLevelChildContainer = rootContainer.createChild();
  const secondLevelChildContainer = firstLevelChildContainer.createChild();
  secondLevelChildContainer.resolve(childScopeLeafToken);

  return {
    id: "child-depth-2-resolve",
    group: "scope",
    what: "resolve a parent binding from a depth-2 child (realistic per-request shape)",
    batch: CHILD_RESOLVE_BATCH,
    sanity: () => secondLevelChildContainer.resolve(childScopeLeafToken) === 42,
    build: () =>
      batched(CHILD_RESOLVE_BATCH, () => {
        secondLevelChildContainer.resolve(childScopeLeafToken);
      }),
  };
}

function buildChildRequestLifecycleCreateResolveDisposeScenario(): BenchScenario {
  const appRootServiceToken = token<number>("bench-cf-scope-request-app-root");
  const childRequestServiceToken = token<number>("bench-cf-scope-request-child");
  const resolvedPayloadToken = token<ScopeResolvedPayload>("bench-cf-scope-request-payload");
  const appContainer = Container.create();
  appContainer
    .bind(appRootServiceToken)
    .toDynamic(() => 41)
    .transient();

  function runOneRequestLifecycle(): ScopeResolvedPayload {
    const firstLevelChildContainer = appContainer.createChild();
    const secondLevelChildContainer = firstLevelChildContainer.createChild();

    firstLevelChildContainer
      .bind(childRequestServiceToken)
      .toDynamic(() => 1)
      .transient();
    firstLevelChildContainer
      .bind(resolvedPayloadToken)
      .toDynamic((resolutionContext) => ({
        appValue: resolutionContext.resolve(appRootServiceToken),
        childValue: resolutionContext.resolve(childRequestServiceToken),
      }))
      .transient();

    const resolvedPayload = secondLevelChildContainer.resolve(resolvedPayloadToken);

    firstLevelChildContainer.unbindAll();
    secondLevelChildContainer.unbindAll();

    return resolvedPayload;
  }

  return {
    id: "child-request-lifecycle-create-resolve-dispose",
    group: "scope",
    what: "create per-request child container, resolve from grandchild depth-2, then unbind/dispose",
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

/**
 * @since 0.3.16-canary.0
 */
export function buildCodefastScopeScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildChildDepthTwoResolveScenario(),
    buildChildRequestLifecycleCreateResolveDisposeScenario(),
  ];
}
