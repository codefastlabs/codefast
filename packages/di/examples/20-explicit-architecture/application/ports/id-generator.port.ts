/** The outbound port that mints new account identifiers, and its token. */

import { token } from "@codefast/di";

import type { AccountId } from "#/examples/20-explicit-architecture/domain/account-id";

/** Produces a fresh, unique `AccountId` on demand. */
export interface IdGenerator {
  /** The next identifier. */
  next(): AccountId;
}

/** The injection token that names the identifier-minting port. */
export const IdGeneratorToken = token<IdGenerator>("IdGenerator");
