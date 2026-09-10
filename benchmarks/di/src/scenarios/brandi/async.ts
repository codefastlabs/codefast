/**
 * Brandi — async scenario. Parallel to `../codefast/async.ts`.
 *
 * Brandi has no container-level async resolution; its async idiom is an
 * `AsyncFactory` — a token bound with `toFactory(creator, asyncInitializer)` that
 * `get()` returns as a `() => Promise<T>`. The caller awaits the factory call, which
 * constructs and runs the async initializer fresh each time (cold path).
 */
import { createContainer, token } from "brandi";
import type { AsyncFactory } from "brandi";

import { ASYNC_INIT_SINGLE_HOP } from "#/fixtures/scenario-parity";
import type { AsyncBenchScenario } from "#/scenarios/types";

class AsyncInitService {
  readonly ready = true;
}

const ASYNC_FACTORY_TOKEN = token<AsyncFactory<AsyncInitService>>("bench-brandi-async-init-factory");

function buildAsyncInitSingleHopScenario(): AsyncBenchScenario {
  const container = createContainer();
  container.bind(ASYNC_FACTORY_TOKEN).toFactory(AsyncInitService, async () => {
    await Promise.resolve();
  });

  return {
    ...ASYNC_INIT_SINGLE_HOP,
    // brandi's async is an AsyncFactory the caller fetches and awaits — no container-level resolveAsync.
    what: "await an AsyncFactory (toFactory async initializer) fetched via get(), rebuilt each iteration",
    kind: "async",
    batch: 1,
    sanity: async () => (await container.get(ASYNC_FACTORY_TOKEN)()).ready,
    build: () => {
      return async () => {
        const service = await container.get(ASYNC_FACTORY_TOKEN)();
        if (!service.ready) {
          throw new Error("Expected async-constructed service to be ready");
        }
      };
    },
  };
}

/**
 * Builds the brandi async scenarios.
 */
export function buildBrandiAsyncScenarios(): ReadonlyArray<AsyncBenchScenario> {
  return [buildAsyncInitSingleHopScenario()];
}
