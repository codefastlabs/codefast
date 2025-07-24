/**
 * Command Handler Interface
 *
 * Base interface for all command handlers in the CQRS pattern.
 * Command handlers execute commands and may return results.
 */

import type { Command } from "@/application/command/command.interface";

export interface CommandHandler<TCommand extends Command, TResult = void> {
  handle: (command: TCommand) => Promise<TResult>;
}
