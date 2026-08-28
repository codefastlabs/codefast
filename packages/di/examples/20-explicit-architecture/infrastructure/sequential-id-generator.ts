/** An `IdGenerator` adapter that issues monotonically increasing, human-readable ids. */

import { injectable } from "@codefast/di";

import type { IdGenerator } from "#/examples/20-explicit-architecture/application/ports/id-generator.port";
import { toAccountId } from "#/examples/20-explicit-architecture/domain/account-id";
import type { AccountId } from "#/examples/20-explicit-architecture/domain/account-id";

/** Hands out `acc-0001`, `acc-0002`, … — deterministic output keeps the example reproducible. */
@injectable()
export class SequentialIdGenerator implements IdGenerator {
  #counter = 0;

  next(): AccountId {
    this.#counter += 1;

    return toAccountId(`acc-${String(this.#counter).padStart(4, "0")}`);
  }
}
