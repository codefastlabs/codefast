/** An `EventHandler` adapter that appends every event to an in-memory audit trail. */

import { injectable } from "@codefast/di";

import type { EventHandler } from "#/examples/20-explicit-architecture/application/ports/events.port";
import type { DomainEvent } from "#/examples/20-explicit-architecture/domain/events";

/** Records the type of each event it sees, in order, for later inspection. */
@injectable()
export class AuditLogHandler implements EventHandler {
  readonly #entries: Array<string> = [];

  handle(event: DomainEvent): void {
    this.#entries.push(event.type);
  }

  /** The recorded event types, oldest first. */
  get entries(): ReadonlyArray<string> {
    return this.#entries;
  }
}
