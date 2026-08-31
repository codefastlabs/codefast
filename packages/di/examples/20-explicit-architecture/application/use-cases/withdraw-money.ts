/** The `WithdrawMoney` use case — loads an account, applies a withdrawal, and records the event. */

import { inject, injectable } from "@codefast/di";

import { AccountRepositoryToken } from "#/examples/20-explicit-architecture/application/ports/account-repository.port";
import type { AccountRepository } from "#/examples/20-explicit-architecture/application/ports/account-repository.port";
import { ClockToken } from "#/examples/20-explicit-architecture/application/ports/clock.port";
import type { Clock } from "#/examples/20-explicit-architecture/application/ports/clock.port";
import { EventPublisherToken } from "#/examples/20-explicit-architecture/application/ports/events.port";
import type { EventPublisher } from "#/examples/20-explicit-architecture/application/ports/events.port";
import type {
  WithdrawMoneyCommand,
  WithdrawMoneyUseCase,
} from "#/examples/20-explicit-architecture/application/ports/use-cases.port";
import { toAccountId } from "#/examples/20-explicit-architecture/domain/account-id";
import { AccountNotFoundError } from "#/examples/20-explicit-architecture/domain/errors";
import { Money } from "#/examples/20-explicit-architecture/domain/money";

/** Removes funds from an account, letting the aggregate refuse an overdraft through its own invariant. */
@injectable([inject(AccountRepositoryToken), inject(ClockToken), inject(EventPublisherToken)])
export class WithdrawMoney implements WithdrawMoneyUseCase {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly clock: Clock,
    private readonly events: EventPublisher,
  ) {}

  execute(command: WithdrawMoneyCommand): void {
    const account = this.accounts.findById(toAccountId(command.accountId));

    if (account === undefined) {
      throw new AccountNotFoundError(command.accountId);
    }

    const amount = Money.of(command.amountMajor, command.currency);

    account.withdraw(amount);
    this.accounts.save(account);
    this.events.publish({
      type: "MoneyWithdrawn",
      accountId: account.id,
      amountMinor: amount.amountMinor,
      currency: amount.currency,
      at: this.clock.now(),
    });
  }
}
