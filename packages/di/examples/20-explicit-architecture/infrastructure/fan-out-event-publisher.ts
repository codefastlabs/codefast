/** An `EventPublisher` adapter that fans each event out to every subscribed `EventHandler`. */

import { injectable, injectAll } from "@codefast/di";

import { EventHandlerToken } from "#/examples/20-explicit-architecture/application/ports/events.port";
import type { EventHandler, EventPublisher } from "#/examples/20-explicit-architecture/application/ports/events.port";
import type { DomainEvent } from "#/examples/20-explicit-architecture/domain/events";

/** Broadcasts every published event to every adapter bound to the `EventHandler` port. */
@injectable([injectAll(EventHandlerToken)])
export class FanOutEventPublisher implements EventPublisher {
  constructor(private readonly handlers: ReadonlyArray<EventHandler>) {}

  publish(event: DomainEvent): void {
    for (const handler of this.handlers) {
      handler.handle(event);
    }
  }
}
