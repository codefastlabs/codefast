/**
 * Command Registry
 *
 * Registry for managing CLI commands following Explicit Architecture principles.
 * Provides automatic command discovery and registration capabilities.
 */

import { injectable, multiInject } from "inversify";

import type { CommandInterface, CommandMetadata } from "@/commands/interfaces/command.interface";

import { TYPES } from "@/di/types";

@injectable()
export class CommandRegistry {
  private readonly commands = new Map<string, CommandInterface>();

  constructor(
    @multiInject(TYPES.Command)
    private readonly commandList: CommandInterface[],
  ) {
    this.registerCommands();
  }

  /**
   * Get all registered commands
   */
  getCommands(): CommandInterface[] {
    return [...this.commands.values()];
  }

  /**
   * Get a specific command by name
   */
  getCommand(name: string): CommandInterface | undefined {
    return this.commands.get(name);
  }

  /**
   * Get command metadata for all registered commands
   */
  getCommandMetadata(): CommandMetadata[] {
    return this.getCommands().map((command) => ({
      description: command.description,
      name: command.name,
    }));
  }

  /**
   * Check if a command is registered
   */
  hasCommand(name: string): boolean {
    return this.commands.has(name);
  }

  /**
   * Register all injected commands
   */
  private registerCommands(): void {
    for (const command of this.commandList) {
      if (this.commands.has(command.name)) {
        throw new Error(`Command '${command.name}' is already registered`);
      }

      this.commands.set(command.name, command);
    }
  }
}
