/** A `NotificationSender` adapter delivering over a Discord webhook — a runnable mock that logs the message. */

import { injectable } from "@codefast/di";

import type { NotificationSender } from "#/examples/21-explicit-architecture-ecommerce/application/ports/notification-sender";

/** Delivers over the `discord` channel by posting to a mock webhook after a short simulated latency. */
@injectable()
export class DiscordNotificationSender implements NotificationSender {
  readonly channel = "discord";

  async send(recipient: string, message: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 4));
    console.log(`    [discord→${recipient}] ${message}`);
  }
}
