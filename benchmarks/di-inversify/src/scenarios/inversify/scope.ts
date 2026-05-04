/**
 * InversifyJS 8 — child-container scope scenarios. Parallel to
 * {@link ../codefast/scope.ts}.
 *
 * `new Container({ parent: ... })` is inversify's way of spelling
 * `codefast.createChild()`. Resolution cascades to the parent on a miss,
 * same semantic.
 */
import "reflect-metadata";
import { Container } from "inversify";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

const CHILD_RESOLVE_BATCH = 500;
const REQUEST_LIFECYCLE_BATCH = 100;

function buildChildDepthTwoResolveScenario(): BenchScenario {
  const childScopeLeafIdentifier = Symbol("bench-inv-child2-leaf");
  const rootContainer = new Container();
  rootContainer.bind<number>(childScopeLeafIdentifier).toConstantValue(42);
  const firstLevelChildContainer = new Container({ parent: rootContainer });
  const secondLevelChildContainer = new Container({ parent: firstLevelChildContainer });
  secondLevelChildContainer.get(childScopeLeafIdentifier);

  return {
    id: "child-depth-2-resolve",
    group: "scope",
    what: "resolve a parent binding from a depth-2 child (realistic per-request shape)",
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

  const appContainer = new Container();
  appContainer
    .bind<number>(appRootServiceIdentifier)
    .toDynamicValue(() => 41)
    .inTransientScope();

  function runOneRequestLifecycle(): ScopeResolvedPayload {
    const firstLevelChildContainer = new Container({ parent: appContainer });
    const secondLevelChildContainer = new Container({ parent: firstLevelChildContainer });

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

    const resolvedPayload =
      secondLevelChildContainer.get<ScopeResolvedPayload>(resolvedPayloadIdentifier);

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
export function buildInversifyScopeScenarios(): readonly BenchScenario[] {
  return [
    buildChildDepthTwoResolveScenario(),
    buildChildRequestLifecycleCreateResolveDisposeScenario(),
  ];
}
