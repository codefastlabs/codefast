/**
 * tsyringe — a class registered against itself as a singleton, resolved by its constructor.
 */
import "reflect-metadata";
import { container as tsyringeRootContainer, inject, injectable, Lifecycle } from "tsyringe";

import { TO_SELF_BATCH, TO_SELF_BINDING } from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

@injectable()
class SelfBoundLeaf {
  readonly tag = "self-bound-leaf";
}

@injectable()
class SelfBoundRoot {
  readonly tag = "self-bound-root";
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(SelfBoundLeaf)
    readonly leaf: SelfBoundLeaf,
  ) {}
}

function buildToSelfSingletonScenario(): BenchScenario {
  const container = tsyringeRootContainer.createChildContainer();
  container.register(SelfBoundLeaf, { useClass: SelfBoundLeaf }, { lifecycle: Lifecycle.Singleton });
  container.register(SelfBoundRoot, { useClass: SelfBoundRoot }, { lifecycle: Lifecycle.Singleton });
  const prewarmed = container.resolve(SelfBoundRoot);

  return {
    ...TO_SELF_BINDING,
    what: "resolve a Singleton class registered useClass against itself — the constructor is the token (cache hit)",
    batch: TO_SELF_BATCH,
    sanity: () => {
      const result = container.resolve(SelfBoundRoot);
      return result === prewarmed && result.tag === "self-bound-root";
    },
    build: () =>
      batched(TO_SELF_BATCH, () => {
        container.resolve(SelfBoundRoot);
      }),
  };
}

/**
 * Builds tsyringe's binding-variant scenarios.
 */
export function buildTsyringeBindingVariantScenarios(): ReadonlyArray<BenchScenario> {
  return [buildToSelfSingletonScenario()];
}
