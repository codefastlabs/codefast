/**
 * InversifyJS 8 — child-container scope scenarios. Parallel to
 * `../codefast/scope.ts`.
 *
 * `new Container({ parent: ... })` is inversify's way of spelling
 * `codefast.createChild()`. Resolution cascades to the parent on a miss,
 * same semantic.
 */
import "reflect-metadata";
import { Container } from "inversify";

import {
  CHILD_DEPTH_2_RESOLVE,
  CHILD_REQUEST_LIFECYCLE_CREATE_RESOLVE_DISPOSE,
  CHILD_RESOLVE_BATCH,
  REQUEST_LIFECYCLE_BATCH,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

function buildChildDepthTwoResolveScenario(): BenchScenario {
  const childScopeLeafIdentifier = Symbol("bench-inv-child2-leaf");
  const rootContainer = new Container({ jitless: false });
  rootContainer.bind<number>(childScopeLeafIdentifier).toConstantValue(42);
  const firstLevelChildContainer = new Container({ jitless: false, parent: rootContainer });
  const secondLevelChildContainer = new Container({ jitless: false, parent: firstLevelChildContainer });
  secondLevelChildContainer.get(childScopeLeafIdentifier);

  return {
    ...CHILD_DEPTH_2_RESOLVE,
    batch: CHILD_RESOLVE_BATCH,
    sanity: () => secondLevelChildContainer.get<number>(childScopeLeafIdentifier) === 42,
    build: () =>
      batched(CHILD_RESOLVE_BATCH, () => {
        secondLevelChildContainer.get(childScopeLeafIdentifier);
      }),
  };
}

interface ScopeResolvedPayload {
  readonly appValue: number;
  readonly childValue: number;
}

function buildChildRequestLifecycleCreateResolveDisposeScenario(): BenchScenario {
  const appRootServiceIdentifier = Symbol("bench-inv-scope-request-app-root");
  const childRequestServiceIdentifier = Symbol("bench-inv-scope-request-child");
  const resolvedPayloadIdentifier = Symbol("bench-inv-scope-request-payload");

  const appContainer = new Container({ jitless: false });
  appContainer
    .bind<number>(appRootServiceIdentifier)
    .toDynamicValue(() => 41)
    .inTransientScope();

  function runOneRequestLifecycle(): ScopeResolvedPayload {
    const firstLevelChildContainer = new Container({ jitless: false, parent: appContainer });
    const secondLevelChildContainer = new Container({ jitless: false, parent: firstLevelChildContainer });

    firstLevelChildContainer
      .bind<number>(childRequestServiceIdentifier)
      .toDynamicValue(() => 1)
      .inTransientScope();
    firstLevelChildContainer
      .bind<ScopeResolvedPayload>(resolvedPayloadIdentifier)
      .toDynamicValue((resolutionContext) => ({
        appValue: resolutionContext.get<number>(appRootServiceIdentifier),
        childValue: resolutionContext.get<number>(childRequestServiceIdentifier),
      }))
      .inTransientScope();

    const resolvedPayload = secondLevelChildContainer.get<ScopeResolvedPayload>(resolvedPayloadIdentifier);

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
export function buildInversifyScopeScenarios(): ReadonlyArray<BenchScenario> {
  return [buildChildDepthTwoResolveScenario(), buildChildRequestLifecycleCreateResolveDisposeScenario()];
}
