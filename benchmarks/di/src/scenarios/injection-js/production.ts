/**
 * injection-js — production-shaped scenarios: the event-bus row only.
 *
 * `production-event-bus-dispatch`: eight `multi: true` value providers under one token, then
 * `get()` — which hands back the cached provider array — and a dispatch to each handler. The
 * per-request rows are absent: `ReflectiveInjector` has no teardown, so a request child cannot
 * be disposed the way every other side disposes its child.
 */
import "reflect-metadata";
import type { ValueProvider } from "injection-js";
import { InjectionToken, ReflectiveInjector } from "injection-js";

import { EVENT_DISPATCH_BATCH, EVENT_HANDLER_COUNT, PRODUCTION_EVENT_BUS_DISPATCH } from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

interface EventHandler {
  handle(event: string): void;
}

const eventHandlerToken = new InjectionToken<ReadonlyArray<EventHandler>>("bench-injection-js-prod-event-handler");

function buildProductionEventBusDispatchScenario(): BenchScenario {
  const providers: Array<ValueProvider> = [];
  for (let handlerIndex = 0; handlerIndex < EVENT_HANDLER_COUNT; handlerIndex++) {
    const index = handlerIndex;
    const handler: EventHandler = { handle: (_event: string) => void index };
    providers.push({ provide: eventHandlerToken, useValue: handler, multi: true });
  }
  const injector = ReflectiveInjector.resolveAndCreate(providers);
  const prewarmedHandlers = injector.get(eventHandlerToken) as ReadonlyArray<EventHandler>;

  return {
    ...PRODUCTION_EVENT_BUS_DISPATCH,
    // injection-js hands back the cached multi:true array, so this row is dispatch over a cached collection.
    what: `get() the cached multi:true array of ${String(EVENT_HANDLER_COUNT)} handlers then dispatch event to each`,
    batch: EVENT_DISPATCH_BATCH,
    sanity: () => prewarmedHandlers.length === EVENT_HANDLER_COUNT,
    build: () =>
      batched(EVENT_DISPATCH_BATCH, () => {
        for (const handler of injector.get(eventHandlerToken) as ReadonlyArray<EventHandler>) {
          handler.handle("user.created");
        }
      }),
  };
}

/**
 * Builds injection-js's production-shaped scenarios.
 *
 * @since 0.8.0
 */
export function buildInjectionJsProductionScenarios(): ReadonlyArray<BenchScenario> {
  return [buildProductionEventBusDispatchScenario()];
}
