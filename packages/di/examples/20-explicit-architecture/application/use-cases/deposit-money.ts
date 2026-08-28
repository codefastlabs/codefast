/** The `DepositMoney` use case — loads an account, applies a deposit, and records the event. */

import { inject, injectable } from "@codefast/di";

import { AccountRepositoryToken } from "#/examples/20-explicit-architecture/application/ports/account-repository.port";
import type { AccountRepository } from "#/examples/20-explicit-architecture/application/ports/account-repository.port";
import { ClockToken } from "#/examples/20-explicit-architecture/application/ports/clock.port";
import type { Clock } from "#/examples/20-explicit-architecture/application/ports/clock.port";
import { EventPublisherToken } from "#/examples/20-explicit-architecture/application/ports/events.port";
import type { EventPublisher } from "#/examples/20-explicit-architecture/application/ports/events.port";
import type {
  DepositMoneyCommand,
  DepositMoneyUseCase,
} from "#/examples/20-explicit-architecture/application/ports/use-cases.port";
import { toAccountId } from "#/examples/20-explicit-architecture/domain/account-id";
import { AccountNotFoundError } from "#/examples/20-explicit-architecture/domain/errors";
import { Money } from "#/examples/20-explicit-architecture/domain/money";

/** Adds funds to an existing account, letting the aggregate enforce its own invariants. */
@injectable([inject(AccountRepositoryToken), inject(ClockToken), inject(EventPublisherToken)])
export class DepositMoney implements DepositMoneyUseCase {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly clock: Clock,
    private readonly events: EventPublisher,
  ) {}

  execute(command: DepositMoneyCommand): void {
    const account = this.accounts.findById(toAccountId(command.accountId));

    if (account === undefined) {
      throw new AccountNotFoundError(command.accountId);
    }

    const amount = Money.of(command.amountMajor, command.currency);

    account.deposit(amount);
    this.accounts.save(account);
    this.events.publish({
      type: "MoneyDeposited",
      accountId: account.id,
      amountMinor: amount.amountMinor,
      currency: amount.currency,
      at: this.clock.now(),
    });
  }
}
