/** The `OpenAccount` use case — orchestrates opening an account through outbound ports only. */

import { inject, injectable } from "@codefast/di";

import { AccountRepositoryToken } from "#/examples/20-explicit-architecture/application/ports/account-repository.port";
import type { AccountRepository } from "#/examples/20-explicit-architecture/application/ports/account-repository.port";
import { ClockToken } from "#/examples/20-explicit-architecture/application/ports/clock.port";
import type { Clock } from "#/examples/20-explicit-architecture/application/ports/clock.port";
import { EventPublisherToken } from "#/examples/20-explicit-architecture/application/ports/events.port";
import type { EventPublisher } from "#/examples/20-explicit-architecture/application/ports/events.port";
import { IdGeneratorToken } from "#/examples/20-explicit-architecture/application/ports/id-generator.port";
import type { IdGenerator } from "#/examples/20-explicit-architecture/application/ports/id-generator.port";
import type {
  OpenAccountCommand,
  OpenAccountUseCase,
} from "#/examples/20-explicit-architecture/application/ports/use-cases.port";
import { Account } from "#/examples/20-explicit-architecture/domain/account";
import type { AccountId } from "#/examples/20-explicit-architecture/domain/account-id";

/** Opens an account, persists it, and announces the `AccountOpened` event. */
@injectable([inject(AccountRepositoryToken), inject(IdGeneratorToken), inject(ClockToken), inject(EventPublisherToken)])
export class OpenAccount implements OpenAccountUseCase {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
    private readonly events: EventPublisher,
  ) {}

  execute(command: OpenAccountCommand): AccountId {
    const id = this.ids.next();
    const account = Account.open(id, command.owner, command.currency);

    this.accounts.save(account);
    this.events.publish({
      type: "AccountOpened",
      accountId: id,
      owner: command.owner,
      currency: command.currency,
      at: this.clock.now(),
    });

    return id;
  }
}
