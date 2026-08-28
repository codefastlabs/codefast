/** The outbound port that mints new identifiers. */

import { token } from "@codefast/di";

/** Produces a fresh, unique identifier carrying the given `prefix`. */
export interface IdGenerator {
  /** The next identifier, e.g. `next("order_")` → `order_000123`. */
  next(prefix: string): string;
}

/** The injection token that binds the `IdGenerator` port to its adapter. */
export const IdGeneratorToken = token<IdGenerator>("IdGenerator");
