/** An `EventHandler` adapter that flags large-transfer attempts for a fraud analyst to review. */

import { injectable } from "@codefast/di";

import type { EventHandler } from "#/examples/20-explicit-architecture/application/ports/events.port";
import type { DomainEvent } from "#/examples/20-explicit-architecture/domain/events";

/** Reacts only to `LargeTransferAttempted`, counting the movements queued for fraud review. */
@injectable()
export class FraudEngineHandler implements EventHandler {
  #flagged = 0;

  handle(event: DomainEvent): void {
    if (event.type === "LargeTransferAttempted") {
      this.#flagged += 1;
    }
  }

  /** How many large transfers have been flagged for review. */
  get flagged(): number {
    return this.#flagged;
  }
}
