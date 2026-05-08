/**
 * @codefast/di — lifecycle-focused scenarios.
 *
 * These rows exercise hot paths tied to lifecycle decorators and deactivation:
 * - `lifecycle-post-construct-singleton`: singleton resolve with `@postConstruct`.
 * - `lifecycle-pre-destroy-unbind`: singleton unbind path with `@preDestroy`.
 */
import { Container, injectable, postConstruct, preDestroy, token } from "@codefast/di";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

const LIFECYCLE_POST_CONSTRUCT_BATCH = 250;

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
const preDestroyTrackedServiceToken = token<PreDestroyTrackedService>(
  "bench-cf-lifecycle-pre-destroy-service",
);

function buildLifecyclePostConstructSingletonScenario(): BenchScenario {
  const container = Container.create();
  container.bind(lifecycleLeafDependencyToken).to(LifecycleLeafDependency).singleton();
  container.bind(postConstructSingletonServiceToken).to(PostConstructSingletonService).singleton();
  container.resolve(postConstructSingletonServiceToken);

  return {
    id: "lifecycle-post-construct-singleton",
    group: "lifecycle",
    what: "resolve singleton class with @postConstruct already warmed",
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
    id: "lifecycle-pre-destroy-unbind",
    group: "lifecycle",
    what: "unbind singleton and run onDeactivation + @preDestroy lifecycle",
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

/**
 * @since 0.3.16-canary.0
 */
export function buildCodefastLifecycleScenarios(): ReadonlyArray<BenchScenario> {
  return [buildLifecyclePostConstructSingletonScenario(), buildLifecyclePreDestroyUnbindScenario()];
}
