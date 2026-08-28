/** The inbound ports the primary adapter drives, their command shapes, and their tokens. */

import { token } from "@codefast/di";

import type { AccountId } from "#/examples/20-explicit-architecture/domain/account-id";

// ── Commands ─────────────────────────────────────────────────────────────────────────────────────────────────────────

/** Instruction to open a new account. */
export interface OpenAccountCommand {
  owner: string;
  currency: string;
}

/** Instruction to add funds to an account. */
export interface DepositMoneyCommand {
  accountId: string;
  amountMajor: number;
  currency: string;
}

/** Instruction to move funds between two accounts. */
export interface TransferMoneyCommand {
  fromAccountId: string;
  toAccountId: string;
  amountMajor: number;
  currency: string;
}

// ── Ports ────────────────────────────────────────────────────────────────────────────────────────────────────────────

/** Opens an account and returns its new id. */
export interface OpenAccountUseCase {
  execute(command: OpenAccountCommand): AccountId;
}

/** Adds funds to an existing account. */
export interface DepositMoneyUseCase {
  execute(command: DepositMoneyCommand): void;
}

/** Moves funds from one account to another. */
export interface TransferMoneyUseCase {
  execute(command: TransferMoneyCommand): void;
}

// ── Tokens ───────────────────────────────────────────────────────────────────────────────────────────────────────────

/** The injection token that names the open-account use case. */
export const OpenAccountUseCaseToken = token<OpenAccountUseCase>("OpenAccountUseCase");

/** The injection token that names the deposit-money use case. */
export const DepositMoneyUseCaseToken = token<DepositMoneyUseCase>("DepositMoneyUseCase");

/** The injection token that names the transfer-money use case. */
export const TransferMoneyUseCaseToken = token<TransferMoneyUseCase>("TransferMoneyUseCase");
