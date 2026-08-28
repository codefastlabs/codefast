/** An `EventHandler` adapter that records large movements to a compliance ledger for reporting. */

import { injectable } from "@codefast/di";

import type { EventHandler } from "#/examples/20-explicit-architecture/application/ports/events.port";
import type { DomainEvent } from "#/examples/20-explicit-architecture/domain/events";

/** Reacts only to `LargeTransferAttempted`, keeping a human-readable ledger of large movements. */
@injectable()
export class ComplianceLogHandler implements EventHandler {
  readonly #movements: Array<string> = [];

  handle(event: DomainEvent): void {
    if (event.type === "LargeTransferAttempted") {
      const major = (event.amountMinor / 100).toFixed(2);
      this.#movements.push(`${event.currency} ${major} ${event.fromAccountId} → ${event.toAccountId}`);
    }
  }

  /** The large movements recorded for regulatory reporting, oldest first. */
  get movements(): ReadonlyArray<string> {
    return this.#movements;
  }
}
