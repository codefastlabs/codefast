/** The `TransferMoney` use case — the atomic move of funds between two accounts. */

import { inject, injectable } from "@codefast/di";

import { AccountRepositoryToken } from "#/examples/20-explicit-architecture/application/ports/account-repository.port";
import type { AccountRepository } from "#/examples/20-explicit-architecture/application/ports/account-repository.port";
import { ClockToken } from "#/examples/20-explicit-architecture/application/ports/clock.port";
import type { Clock } from "#/examples/20-explicit-architecture/application/ports/clock.port";
import { EventPublisherToken } from "#/examples/20-explicit-architecture/application/ports/events.port";
import type { EventPublisher } from "#/examples/20-explicit-architecture/application/ports/events.port";
import type {
  TransferMoneyCommand,
  TransferMoneyUseCase,
} from "#/examples/20-explicit-architecture/application/ports/use-cases.port";
import { toAccountId } from "#/examples/20-explicit-architecture/domain/account-id";
import { AccountNotFoundError } from "#/examples/20-explicit-architecture/domain/errors";
import { Money } from "#/examples/20-explicit-architecture/domain/money";

/** Withdraws from the source account and deposits into the target, then records the transfer. */
@injectable([inject(AccountRepositoryToken), inject(ClockToken), inject(EventPublisherToken)])
export class TransferMoney implements TransferMoneyUseCase {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly clock: Clock,
    private readonly events: EventPublisher,
  ) {}

  execute(command: TransferMoneyCommand): void {
    const from = this.accounts.findById(toAccountId(command.fromAccountId));

    if (from === undefined) {
      throw new AccountNotFoundError(command.fromAccountId);
    }

    const to = this.accounts.findById(toAccountId(command.toAccountId));

    if (to === undefined) {
      throw new AccountNotFoundError(command.toAccountId);
    }

    const amount = Money.of(command.amountMajor, command.currency);

    from.withdraw(amount);
    to.deposit(amount);
    this.accounts.save(from);
    this.accounts.save(to);
    this.events.publish({
      type: "MoneyTransferred",
      fromAccountId: from.id,
      toAccountId: to.id,
      amountMinor: amount.amountMinor,
      currency: amount.currency,
      at: this.clock.now(),
    });
  }
}
