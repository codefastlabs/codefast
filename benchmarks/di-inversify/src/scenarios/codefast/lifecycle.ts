/**
 * @codefast/di — lifecycle-focused scenarios.
 *
 * These rows exercise hot paths tied to lifecycle decorators and deactivation:
 * - `lifecycle-post-construct-singleton`: singleton resolve with `@postConstruct`.
 * - `lifecycle-pre-destroy-unbind`: singleton unbind path with `@preDestroy`.
 * - `binding-level-activation-hook`: transient resolve through a per-binding `.onActivation()`.
 */
import { Container, injectable, postConstruct, preDestroy, token } from "@codefast/di";

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

const lifecycleLeafDependencyToken = token<LifecycleLeafDependency>("bench-cf-lifecycle-leaf");

@injectable([lifecycleLeafDependencyToken])
class PostConstructSingletonService {
  postConstructCallCount: number = 0;
  resultValue: number = 0;

  constructor(readonly leafDependency: LifecycleLeafDependency) {}

  @postConstruct()
  warmUp(): void {
    this.postConstructCallCount += 1;
    this.resultValue = this.leafDependency.value + 1;
  }
}

class PreDestroyTrackedService {
  preDestroyCallCount: number = 0;

  @preDestroy()
  cleanup(): void {
    this.preDestroyCallCount += 1;
  }
}

const postConstructSingletonServiceToken = token<PostConstructSingletonService>(
  "bench-cf-lifecycle-post-construct-service",
);
const preDestroyTrackedServiceToken = token<PreDestroyTrackedService>("bench-cf-lifecycle-pre-destroy-service");

function buildLifecyclePostConstructSingletonScenario(): BenchScenario {
  const container = Container.create();
  container.bind(lifecycleLeafDependencyToken).to(LifecycleLeafDependency).singleton();
  container.bind(postConstructSingletonServiceToken).to(PostConstructSingletonService).singleton();
  container.resolve(postConstructSingletonServiceToken);

  return {
    ...LIFECYCLE_POST_CONSTRUCT_SINGLETON,
    batch: LIFECYCLE_POST_CONSTRUCT_BATCH,
    sanity: () => {
      const firstResolution = container.resolve(postConstructSingletonServiceToken);
      const secondResolution = container.resolve(postConstructSingletonServiceToken);
      return (
        firstResolution === secondResolution &&
        firstResolution.postConstructCallCount === 1 &&
        firstResolution.resultValue === 42
      );
    },
    build: () =>
      batched(LIFECYCLE_POST_CONSTRUCT_BATCH, () => {
        container.resolve(postConstructSingletonServiceToken);
      }),
  };
}

function buildLifecyclePreDestroyUnbindScenario(): BenchScenario {
  function runOneUnbindCycle(): void {
    const container = Container.create();
    let onDeactivationCallCount: number = 0;
    container
      .bind(preDestroyTrackedServiceToken)
      .to(PreDestroyTrackedService)
      .singleton()
      .onDeactivation(() => {
        onDeactivationCallCount += 1;
      });

    const instance = container.resolve(preDestroyTrackedServiceToken);
    container.unbind(preDestroyTrackedServiceToken);
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

const bindingHookPayloadToken = token<BindingHookPayload>("bench-cf-lifecycle-binding-hook-payload");

// The per-binding twin of `container-level-activation-hook`: same lane, same workload, the hook
// carried by the binding instead of the container, so the two dispatch costs read apart.
function buildBindingLevelActivationHookScenario(): BenchScenario {
  const container = Container.create();
  let activationCallCount = 0;

  container
    .bind(bindingHookPayloadToken)
    .toDynamic(() => ({ activated: false, value: 1 }))
    .transient()
    .onActivation((_ctx, instance) => {
      activationCallCount += 1;
      instance.activated = true;
      return instance;
    });

  // Pre-warm
  container.resolve(bindingHookPayloadToken);

  return {
    ...BINDING_LEVEL_ACTIVATION_HOOK,
    batch: ACTIVATION_HOOK_BATCH,
    sanity: () => {
      const before = activationCallCount;
      const result = container.resolve(bindingHookPayloadToken);
      return result.activated && activationCallCount === before + 1;
    },
    build: () =>
      batched(ACTIVATION_HOOK_BATCH, () => {
        container.resolve(bindingHookPayloadToken);
      }),
  };
}

/**
 * @since 0.3.16-canary.0
 */
export function buildCodefastLifecycleScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildLifecyclePostConstructSingletonScenario(),
    buildLifecyclePreDestroyUnbindScenario(),
    buildBindingLevelActivationHookScenario(),
  ];
}
