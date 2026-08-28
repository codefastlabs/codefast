/** An `AccountRepository` adapter backed by an in-memory map — the seam a real database would replace. */

import { injectable } from "@codefast/di";

import type { AccountRepository } from "#/examples/20-explicit-architecture/application/ports/account-repository.port";
import type { Account } from "#/examples/20-explicit-architecture/domain/account";
import type { AccountId } from "#/examples/20-explicit-architecture/domain/account-id";

/** Keeps accounts in a `Map`; swap it for a SQL adapter and no domain or use-case code changes. */
@injectable()
export class InMemoryAccountRepository implements AccountRepository {
  readonly #store = new Map<AccountId, Account>();

  findById(id: AccountId): Account | undefined {
    return this.#store.get(id);
  }

  save(account: Account): void {
    this.#store.set(account.id, account);
  }
}
