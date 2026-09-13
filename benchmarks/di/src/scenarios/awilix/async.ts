/**
 * Awilix — async scenario. A transient `asFunction` returning a promise is what awilix hands back
 * from `resolve()`; the caller awaits it, and the factory runs fresh each time.
 */
import { asFunction, createContainer } from "awilix";

import { ASYNC_INIT_SINGLE_HOP } from "#/fixtures/scenario-parity";
import type { AsyncBenchScenario } from "#/scenarios/types";

class AsyncInitService {
  readonly ready = true;
}

function buildAsyncInitSingleHopScenario(): AsyncBenchScenario {
  const container = createContainer();
  container.register({
    asyncService: asFunction(async (): Promise<AsyncInitService> => {
      await Promise.resolve();
      return new AsyncInitService();
    }).transient(),
  });

  return {
    ...ASYNC_INIT_SINGLE_HOP,
    what: "await a transient asFunction() that returns a promise, rebuilt each iteration — awilix passes the promise through",
    kind: "async",
    batch: 1,
    sanity: async () => (await container.resolve<Promise<AsyncInitService>>("asyncService")).ready,
    build: () => {
      return async () => {
        const service = await container.resolve<Promise<AsyncInitService>>("asyncService");
        if (!service.ready) {
          throw new Error("Expected async-constructed service to be ready");
        }
      };
    },
  };
}

/**
 * Builds Awilix's async scenarios.
 *
 * @since 0.8.0
 */
export function buildAwilixAsyncScenarios(): ReadonlyArray<AsyncBenchScenario> {
  return [buildAsyncInitSingleHopScenario()];
}
