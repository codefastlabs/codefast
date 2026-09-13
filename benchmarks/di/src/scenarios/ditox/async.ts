/**
 * Ditox — async scenario. A transient factory returning a promise is what `resolve()` hands back;
 * the caller awaits it, and the factory runs fresh each time.
 */
import { createContainer, token } from "ditox";

import { ASYNC_INIT_SINGLE_HOP } from "#/fixtures/scenario-parity";
import type { AsyncBenchScenario } from "#/scenarios/types";

class AsyncInitService {
  readonly ready = true;
}

const ASYNC_SERVICE = token<Promise<AsyncInitService>>("bench-ditox-async-init-single-hop");

function buildAsyncInitSingleHopScenario(): AsyncBenchScenario {
  const container = createContainer();
  container.bindFactory(
    ASYNC_SERVICE,
    async () => {
      await Promise.resolve();
      return new AsyncInitService();
    },
    { scope: "transient" },
  );

  return {
    ...ASYNC_INIT_SINGLE_HOP,
    what: "await a transient bindFactory that returns a promise, rebuilt each iteration — ditox passes the promise through",
    kind: "async",
    batch: 1,
    sanity: async () => (await container.resolve(ASYNC_SERVICE)).ready,
    build: () => {
      return async () => {
        const service = await container.resolve(ASYNC_SERVICE);
        if (!service.ready) {
          throw new Error("Expected async-constructed service to be ready");
        }
      };
    },
  };
}

/**
 * Builds ditox's async scenarios.
 *
 * @since 0.8.0
 */
export function buildDitoxAsyncScenarios(): ReadonlyArray<AsyncBenchScenario> {
  return [buildAsyncInitSingleHopScenario()];
}
