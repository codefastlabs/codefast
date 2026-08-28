/** A `NotificationSender` adapter delivering over SMS — a runnable mock that logs the message. */

import { injectable } from "@codefast/di";

import type { NotificationSender } from "#/examples/21-explicit-architecture-ecommerce/application/ports/notification-sender";

/** Delivers over the `sms` channel by printing the message after a short simulated latency. */
@injectable()
export class SmsNotificationSender implements NotificationSender {
  readonly channel = "sms";

  async send(recipient: string, message: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 3));
    console.log(`    [sms→${recipient}] ${message}`);
  }
}
