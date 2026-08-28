/** An `EventHandler` adapter that counts events by type — a second subscriber on the same port. */

import { injectable } from "@codefast/di";

import type { EventHandler } from "#/examples/20-explicit-architecture/application/ports/events.port";
import type { DomainEvent } from "#/examples/20-explicit-architecture/domain/events";

/** Tallies how many of each event type it has observed. */
@injectable()
export class MetricsHandler implements EventHandler {
  readonly #counts = new Map<DomainEvent["type"], number>();

  handle(event: DomainEvent): void {
    this.#counts.set(event.type, (this.#counts.get(event.type) ?? 0) + 1);
  }

  /** The total number of events observed across all types. */
  get total(): number {
    let sum = 0;

    for (const count of this.#counts.values()) {
      sum += count;
    }

    return sum;
  }
}
