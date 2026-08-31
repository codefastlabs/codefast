/** A primary (driving) adapter — a stand-in HTTP controller that translates requests into use-case calls. */

import { inject, injectable } from "@codefast/di";

import {
  DepositMoneyUseCaseToken,
  OpenAccountUseCaseToken,
  TransferMoneyUseCaseToken,
  WithdrawMoneyUseCaseToken,
} from "#/examples/20-explicit-architecture/application/ports/use-cases.port";
import type {
  DepositMoneyUseCase,
  OpenAccountUseCase,
  TransferMoneyUseCase,
  WithdrawMoneyUseCase,
} from "#/examples/20-explicit-architecture/application/ports/use-cases.port";
import type { AccountId } from "#/examples/20-explicit-architecture/domain/account-id";

/** Drives the inbound ports; it depends on use-case interfaces, never on concrete implementations. */
@injectable([
  inject(OpenAccountUseCaseToken),
  inject(DepositMoneyUseCaseToken),
  inject(WithdrawMoneyUseCaseToken),
  inject(TransferMoneyUseCaseToken),
])
export class BankingController {
  constructor(
    private readonly openAccount: OpenAccountUseCase,
    private readonly depositMoney: DepositMoneyUseCase,
    private readonly withdrawMoney: WithdrawMoneyUseCase,
    private readonly transferMoney: TransferMoneyUseCase,
  ) {}

  /** Handles `POST /accounts`. */
  open(owner: string, currency: string): AccountId {
    return this.openAccount.execute({ owner, currency });
  }

  /** Handles `POST /accounts/:id/deposits`. */
  deposit(accountId: string, amountMajor: number, currency: string): void {
    this.depositMoney.execute({ accountId, amountMajor, currency });
  }

  /** Handles `POST /accounts/:id/withdrawals`. */
  withdraw(accountId: string, amountMajor: number, currency: string): void {
    this.withdrawMoney.execute({ accountId, amountMajor, currency });
  }

  /** Handles `POST /transfers`. */
  transfer(fromAccountId: string, toAccountId: string, amountMajor: number, currency: string): void {
    this.transferMoney.execute({ fromAccountId, toAccountId, amountMajor, currency });
  }
}
