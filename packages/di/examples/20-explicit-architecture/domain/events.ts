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

/** Emitted when funds are removed from an account. */
export interface MoneyWithdrawn {
  type: "MoneyWithdrawn";
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

/** Emitted when a transfer above the large-transfer threshold is attempted, before it settles. */
export interface LargeTransferAttempted {
  type: "LargeTransferAttempted";
  fromAccountId: AccountId;
  toAccountId: AccountId;
  amountMinor: number;
  currency: string;
  at: Date;
}

/** The closed set of events the domain publishes. */
export type DomainEvent = AccountOpened | MoneyDeposited | MoneyWithdrawn | MoneyTransferred | LargeTransferAttempted;
