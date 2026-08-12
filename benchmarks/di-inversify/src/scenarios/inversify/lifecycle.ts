/**
 * InversifyJS 8 — lifecycle-focused scenarios.
 *
 * Mirrors {@link ../codefast/lifecycle.ts} with equivalent IDs:
 * - `lifecycle-post-construct-singleton`
 * - `lifecycle-pre-destroy-unbind`
 * - `binding-level-activation-hook`
 */
import "reflect-metadata";
import { Container, inject, injectable, postConstruct, preDestroy } from "inversify";

import {
  ACTIVATION_HOOK_BATCH,
  BINDING_LEVEL_ACTIVATION_HOOK,
  LIFECYCLE_POST_CONSTRUCT_BATCH,
  LIFECYCLE_POST_CONSTRUCT_SINGLETON,
  LIFECYCLE_PRE_DESTROY_UNBIND,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

@injectable()
class LifecycleLeafDependency {
  readonly value = 41;
}

const lifecycleLeafDependencyIdentifier = Symbol("bench-inv-lifecycle-leaf");

@injectable()
class PostConstructSingletonService {
  postConstructCallCount: number = 0;
  resultValue: number = 0;

  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(lifecycleLeafDependencyIdentifier)
    readonly leafDependency: LifecycleLeafDependency,
  ) {}

  // @ts-ignore reflect-metadata + explicit token injection
  @postConstruct()
  warmUp(): void {
    this.postConstructCallCount += 1;
    this.resultValue = this.leafDependency.value + 1;
  }
}

@injectable()
class PreDestroyTrackedService {
  preDestroyCallCount: number = 0;

  // @ts-ignore reflect-metadata + explicit token injection
  @preDestroy()
  cleanup(): void {
    this.preDestroyCallCount += 1;
  }
}

const postConstructSingletonServiceIdentifier = Symbol("bench-inv-lifecycle-post-construct-service");
const preDestroyTrackedServiceIdentifier = Symbol("bench-inv-lifecycle-pre-destroy-service");

function buildLifecyclePostConstructSingletonScenario(): BenchScenario {
  const container = new Container({ jitless: false });
  /* Parity with codefast: leaf is a singleton. Only `PostConstructSingletonService`
   * is the subject of the post-construct hook; the leaf is fixed wiring cost. */
  container
    .bind<LifecycleLeafDependency>(lifecycleLeafDependencyIdentifier)
    .to(LifecycleLeafDependency)
    .inSingletonScope();
  container
    .bind<PostConstructSingletonService>(postConstructSingletonServiceIdentifier)
    .to(PostConstructSingletonService)
    .inSingletonScope();
  container.get(postConstructSingletonServiceIdentifier);

  return {
    ...LIFECYCLE_POST_CONSTRUCT_SINGLETON,
    batch: LIFECYCLE_POST_CONSTRUCT_BATCH,
    sanity: () => {
      const firstResolution = container.get<PostConstructSingletonService>(postConstructSingletonServiceIdentifier);
      const secondResolution = container.get<PostConstructSingletonService>(postConstructSingletonServiceIdentifier);
      return (
        firstResolution === secondResolution &&
        firstResolution.postConstructCallCount === 1 &&
        firstResolution.resultValue === 42
      );
    },
    build: () =>
      batched(LIFECYCLE_POST_CONSTRUCT_BATCH, () => {
        container.get(postConstructSingletonServiceIdentifier);
      }),
  };
}

function buildLifecyclePreDestroyUnbindScenario(): BenchScenario {
  function runOneUnbindCycle(): void {
    const container = new Container({ jitless: false });
    let onDeactivationCallCount = 0;
    container
      .bind<PreDestroyTrackedService>(preDestroyTrackedServiceIdentifier)
      .to(PreDestroyTrackedService)
      .inSingletonScope()
      .onDeactivation(() => {
        onDeactivationCallCount += 1;
      });

    const instance = container.get<PreDestroyTrackedService>(preDestroyTrackedServiceIdentifier);
    container.unbind(preDestroyTrackedServiceIdentifier);
    if (instance.preDestroyCallCount !== 1) {
      throw new Error("Expected @preDestroy to run exactly once during unbind");
    }
    if (onDeactivationCallCount !== 1) {
      throw new Error("Expected onDeactivation handler to run exactly once");
    }
  }

  return {
    ...LIFECYCLE_PRE_DESTROY_UNBIND,
    batch: 1,
    sanity: () => {
      runOneUnbindCycle();
      return true;
    },
    build: () => {
      return () => {
        runOneUnbindCycle();
      };
    },
  };
}

interface BindingHookPayload {
  activated: boolean;
  value: number;
}

const bindingHookPayloadIdentifier = Symbol("bench-inv-lifecycle-binding-hook-payload");

function buildBindingLevelActivationHookScenario(): BenchScenario {
  const container = new Container({ jitless: false });
  let activationCallCount = 0;

  container
    .bind<BindingHookPayload>(bindingHookPayloadIdentifier)
    .toDynamicValue(() => ({ activated: false, value: 1 }))
    .inTransientScope()
    .onActivation((_ctx, instance) => {
      activationCallCount += 1;
      instance.activated = true;
      return instance;
    });

  // Pre-warm
  container.get<BindingHookPayload>(bindingHookPayloadIdentifier);

  return {
    ...BINDING_LEVEL_ACTIVATION_HOOK,
    what: "get() transient through a per-binding .onActivation() hook — measures hook dispatch overhead",
    batch: ACTIVATION_HOOK_BATCH,
    sanity: () => {
      const before = activationCallCount;
      const result = container.get<BindingHookPayload>(bindingHookPayloadIdentifier);
      return result.activated && activationCallCount === before + 1;
    },
    build: () =>
      batched(ACTIVATION_HOOK_BATCH, () => {
        container.get(bindingHookPayloadIdentifier);
      }),
  };
}

/**
 * @since 0.3.16-canary.0
 */
export function buildInversifyLifecycleScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildLifecyclePostConstructSingletonScenario(),
    buildLifecyclePreDestroyUnbindScenario(),
    buildBindingLevelActivationHookScenario(),
  ];
}
