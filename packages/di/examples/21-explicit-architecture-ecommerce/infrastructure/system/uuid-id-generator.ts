/** An `IdGenerator` adapter minting sequential identifiers. */

import { injectable } from "@codefast/di";

import type { IdGenerator } from "#/examples/21-explicit-architecture-ecommerce/application/ports/id-generator";

/** Mints deterministic counter-backed ids — not real UUIDs — so example output stays reproducible. */
@injectable()
export class UuidIdGenerator implements IdGenerator {
  #counter = 0;

  next(prefix: string): string {
    this.#counter += 1;

    return `${prefix}${String(this.#counter).padStart(6, "0")}`;
  }
}
