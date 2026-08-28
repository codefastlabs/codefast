/** The domain events an account emits as its state changes. */

import type { AccountId } from "#/examples/20-explicit-architecture/domain/account-id";

// ── Events ───────────────────────────────────────────────────────────────────────────────────────────────────────────

/** Emitted when a new account is opened. */
export interface AccountOpened {
  type: "AccountOpened";
  accountId: AccountId;
  owner: string;
  currency: string;
  at: Date;
}

/** Emitted when funds are added to an account. */
export interface MoneyDeposited {
  type: "MoneyDeposited";
  accountId: AccountId;
  amountMinor: number;
  currency: string;
  at: Date;
}

/** Emitted when funds move between two accounts. */
export interface MoneyTransferred {
  type: "MoneyTransferred";
  fromAccountId: AccountId;
  toAccountId: AccountId;
  amountMinor: number;
  currency: string;
  at: Date;
}

/** The closed set of events the domain publishes. */
export type DomainEvent = AccountOpened | MoneyDeposited | MoneyTransferred;
