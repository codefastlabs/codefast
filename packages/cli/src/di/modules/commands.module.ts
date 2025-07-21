/**
 * Commands Module
 *
 * InversifyJS module for binding commands layer dependencies.
 * Following explicit architecture guidelines for CLI applications.
 * Supports scalable command organization with automatic discovery.
 */

import { ContainerModule } from "inversify";

import type { CommandInterface } from "@/commands/interfaces/command.interface";

import { CommandHandler } from "@/commands/command-handler";
import { AnalyzeCommand } from "@/commands/implementations/analyze.command";
import { CheckComponentTypesCommand } from "@/commands/implementations/check-component-types.command";
import { HelloCommand } from "@/commands/implementations/hello.command";
import { CommandRegistry } from "@/commands/registry/command.registry";
import { TYPES } from "@/di/types";

export const commandsModule = new ContainerModule((options) => {
  // Command Registry
  options.bind<CommandRegistry>(TYPES.CommandRegistry).to(CommandRegistry);

  // Command Handler
  options.bind<CommandHandler>(TYPES.CommandHandler).to(CommandHandler);

  // Individual Commands (automatically discovered by CommandRegistry)
  options.bind<CommandInterface>(TYPES.Command).to(HelloCommand);
  options.bind<CommandInterface>(TYPES.Command).to(AnalyzeCommand);
  options.bind<CommandInterface>(TYPES.Command).to(CheckComponentTypesCommand);
});
