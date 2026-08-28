/** A `NotificationSender` adapter delivering over email — a runnable mock that logs the message. */

import { injectable } from "@codefast/di";

import type { NotificationSender } from "#/examples/21-explicit-architecture-ecommerce/application/ports/notification-sender";

/** Delivers over the `email` channel by printing the message after a short simulated latency. */
@injectable()
export class EmailNotificationSender implements NotificationSender {
  readonly channel = "email";

  async send(recipient: string, message: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 5));
    console.log(`    [email→${recipient}] ${message}`);
  }
}
