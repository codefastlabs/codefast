/**
 * InversifyJS 8 — lifecycle-focused scenarios.
 *
 * Mirrors {@link ../codefast/lifecycle.ts} with equivalent IDs:
 * - `lifecycle-post-construct-singleton`
 * - `lifecycle-pre-destroy-unbind`
 */
import "reflect-metadata";
import { Container, inject, injectable, postConstruct, preDestroy } from "inversify";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

const LIFECYCLE_POST_CONSTRUCT_BATCH = 250;

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

const postConstructSingletonServiceIdentifier = Symbol(
  "bench-inv-lifecycle-post-construct-service",
);
const preDestroyTrackedServiceIdentifier = Symbol("bench-inv-lifecycle-pre-destroy-service");

function buildLifecyclePostConstructSingletonScenario(): BenchScenario {
  const container = new Container();
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
    id: "lifecycle-post-construct-singleton",
    group: "lifecycle",
    what: "resolve singleton class with @postConstruct already warmed",
    batch: LIFECYCLE_POST_CONSTRUCT_BATCH,
    sanity: () => {
      const firstResolution = container.get<PostConstructSingletonService>(
        postConstructSingletonServiceIdentifier,
      );
      const secondResolution = container.get<PostConstructSingletonService>(
        postConstructSingletonServiceIdentifier,
      );
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
    const container = new Container();
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

export function buildInversifyLifecycleScenarios(): readonly BenchScenario[] {
  return [buildLifecyclePostConstructSingletonScenario(), buildLifecyclePreDestroyUnbindScenario()];
}
