/** The outbound port through which the application persists and retrieves accounts, and its token. */

import { token } from "@codefast/di";

import type { Account } from "#/examples/20-explicit-architecture/domain/account";
import type { AccountId } from "#/examples/20-explicit-architecture/domain/account-id";

/** Stores and reloads `Account` aggregates, hiding whatever storage engine sits behind it. */
export interface AccountRepository {
  /** The account with `id`, or `undefined` when none is stored. */
  findById(id: AccountId): Account | undefined;

  /** Persists the current state of `account`. */
  save(account: Account): void;
}

/** The injection token that names the account persistence port. */
export const AccountRepositoryToken = token<AccountRepository>("AccountRepository");
