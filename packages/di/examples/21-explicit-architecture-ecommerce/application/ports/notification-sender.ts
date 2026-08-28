/** The outbound port for notifying a customer — one adapter per channel. */

import { token } from "@codefast/di";

/** Delivers a message over a single channel, e.g. email or SMS. */
export interface NotificationSender {
  /** The channel this adapter delivers over, e.g. `email`. */
  readonly channel: string;

  /** Delivers `message` to `recipient`. */
  send(recipient: string, message: string): Promise<void>;
}

/** The injection token that binds the `NotificationSender` port to its adapters. */
export const NotificationSenderToken = token<NotificationSender>("NotificationSender");
