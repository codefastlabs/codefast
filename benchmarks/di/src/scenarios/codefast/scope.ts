/**
 * `@codefast/di` — child-container scope scenarios.
 *
 *   - `child-depth-N-resolve` — resolve a root binding from a child N levels down, N over the
 *     parent-walk axis; depth 2 is the app → per-request child → nested child shape.
 */
import { Container, token } from "@codefast/di";

import {
  CHILD_DEPTHS,
  CHILD_REQUEST_LIFECYCLE_CREATE_RESOLVE_DISPOSE,
  CHILD_RESOLVE_BATCH,
  childDepthResolveDescriptor,
  REQUEST_LIFECYCLE_BATCH,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

interface ScopeResolvedPayload {
  readonly appValue: number;
  readonly childValue: number;
}

function buildChildDepthResolveScenario(depth: number): BenchScenario {
  const childScopeLeafToken = token<number>(`bench-cf-child${String(depth)}-leaf`);
  const rootContainer = Container.create();
  rootContainer.bind(childScopeLeafToken).toConstantValue(42);
  let deepestContainer = rootContainer;
  for (let level = 0; level < depth; level++) {
    deepestContainer = deepestContainer.createChild();
  }
  deepestContainer.resolve(childScopeLeafToken);

  return {
    ...childDepthResolveDescriptor(depth),
    batch: CHILD_RESOLVE_BATCH,
    sanity: () => deepestContainer.resolve(childScopeLeafToken) === 42,
    build: () =>
      batched(CHILD_RESOLVE_BATCH, () => {
        deepestContainer.resolve(childScopeLeafToken);
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
    ...CHILD_REQUEST_LIFECYCLE_CREATE_RESOLVE_DISPOSE,
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
    ...CHILD_DEPTHS.map((depth) => buildChildDepthResolveScenario(depth)),
    buildChildRequestLifecycleCreateResolveDisposeScenario(),
  ];
}
