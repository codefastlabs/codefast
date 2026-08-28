/** The `Account` aggregate — the entity that owns every balance invariant. */

import type { AccountId } from "#/examples/20-explicit-architecture/domain/account-id";
import { InsufficientFundsError } from "#/examples/20-explicit-architecture/domain/errors";
import { Money } from "#/examples/20-explicit-architecture/domain/money";

/** A bank account whose balance can only change through its own guarded operations. */
export class Account {
  #balance: Money;

  private constructor(
    readonly id: AccountId,
    readonly owner: string,
    balance: Money,
  ) {
    this.#balance = balance;
  }

  /** Opens a fresh account with a zero balance in `currency`. */
  static open(id: AccountId, owner: string, currency: string): Account {
    return new Account(id, owner, Money.zero(currency));
  }

  /** The current balance. */
  get balance(): Money {
    return this.#balance;
  }

  /** Adds `amount` to the balance. */
  deposit(amount: Money): void {
    this.#balance = this.#balance.add(amount);
  }

  /** Removes `amount`, refusing to overdraw the account. */
  withdraw(amount: Money): void {
    if (this.#balance.isLessThan(amount)) {
      throw new InsufficientFundsError(this.#balance.toString(), amount.toString());
    }

    this.#balance = this.#balance.subtract(amount);
  }
}
