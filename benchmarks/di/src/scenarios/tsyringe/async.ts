/**
 * tsyringe — async scenario. A factory provider returning a promise is what `resolve()` hands back;
 * the caller awaits it, and a factory provider never caches, so it runs fresh each time.
 */
import "reflect-metadata";
import { container as tsyringeRootContainer } from "tsyringe";

import { ASYNC_INIT_SINGLE_HOP } from "#/fixtures/scenario-parity";
import type { AsyncBenchScenario } from "#/scenarios/types";

class AsyncInitService {
  readonly ready = true;
}

const asyncServiceToken = Symbol("bench-tsyringe-async-init-single-hop");

function buildAsyncInitSingleHopScenario(): AsyncBenchScenario {
  const container = tsyringeRootContainer.createChildContainer();
  container.register<Promise<AsyncInitService>>(asyncServiceToken, {
    useFactory: async () => {
      await Promise.resolve();
      return new AsyncInitService();
    },
  });

  return {
    ...ASYNC_INIT_SINGLE_HOP,
    what: "await a factory provider that returns a promise, rebuilt each iteration — tsyringe passes the promise through",
    kind: "async",
    batch: 1,
    sanity: async () => (await container.resolve<Promise<AsyncInitService>>(asyncServiceToken)).ready,
    build: () => {
      return async () => {
        const service = await container.resolve<Promise<AsyncInitService>>(asyncServiceToken);
        if (!service.ready) {
          throw new Error("Expected async-constructed service to be ready");
        }
      };
    },
  };
}

/**
 * Builds tsyringe's async scenarios.
 *
 * @since 0.8.0
 */
export function buildTsyringeAsyncScenarios(): ReadonlyArray<AsyncBenchScenario> {
  return [buildAsyncInitSingleHopScenario()];
}
