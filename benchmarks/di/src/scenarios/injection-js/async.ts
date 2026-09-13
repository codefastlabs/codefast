/**
 * injection-js — async scenario. A factory provider returning a promise is what the injector hands
 * back; the caller awaits it, and `instantiateResolved` runs the factory fresh each time.
 */
import "reflect-metadata";
import { InjectionToken, ReflectiveInjector } from "injection-js";

import { ASYNC_INIT_SINGLE_HOP } from "#/fixtures/scenario-parity";
import type { AsyncBenchScenario } from "#/scenarios/types";

class AsyncInitService {
  readonly ready = true;
}

const asyncServiceToken = new InjectionToken<Promise<AsyncInitService>>("bench-injection-js-async-init");

function buildAsyncInitSingleHopScenario(): AsyncBenchScenario {
  const injector = ReflectiveInjector.resolveAndCreate([]);
  const resolvedProvider = ReflectiveInjector.resolve([
    {
      provide: asyncServiceToken,
      useFactory: async (): Promise<AsyncInitService> => {
        await Promise.resolve();
        return new AsyncInitService();
      },
      deps: [],
    },
  ])[0];
  if (resolvedProvider === undefined) {
    throw new Error("injection-js: the async provider failed to resolve");
  }
  const instantiate = (): Promise<AsyncInitService> =>
    injector.instantiateResolved(resolvedProvider) as Promise<AsyncInitService>;

  return {
    ...ASYNC_INIT_SINGLE_HOP,
    what: "await a factory provider that returns a promise, instantiated fresh through instantiateResolved() each iteration",
    kind: "async",
    batch: 1,
    sanity: async () => (await instantiate()).ready,
    build: () => {
      return async () => {
        const service = await instantiate();
        if (!service.ready) {
          throw new Error("Expected async-constructed service to be ready");
        }
      };
    },
  };
}

/**
 * Builds injection-js's async scenarios.
 */
export function buildInjectionJsAsyncScenarios(): ReadonlyArray<AsyncBenchScenario> {
  return [buildAsyncInitSingleHopScenario()];
}
