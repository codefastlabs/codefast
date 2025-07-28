/**
 * Commands Module
 *
 * InversifyJS module for binding commands layer dependencies.
 * Following explicit architecture guidelines for CLI applications.
 * Supports scalable command organization with automatic discovery.
 */

import { ContainerModule } from "inversify";

import type { CommandInterface } from "@/ui/controllers/interfaces/command.interface";

import { DI_TYPES } from "@/shared/di/types";
import { CommandHandler } from "@/ui/controllers/command-handler";
import { CheckComponentTypesCommand } from "@/ui/controllers/implementations/check-component-types.command";
import { HelloCommand } from "@/ui/controllers/implementations/hello.command";
import { TreeShakingCommand } from "@/ui/controllers/implementations/tree-shaking.command";
import { CommandRegistry } from "@/ui/controllers/registry/command.registry";

export const commandsModule = new ContainerModule((options) => {
  // Command Registry
  options.bind<CommandRegistry>(DI_TYPES.CommandRegistry).to(CommandRegistry);

  // Command Handler
  options.bind<CommandHandler>(DI_TYPES.CommandHandler).to(CommandHandler);

  // Individual Commands (automatically discovered by CommandRegistry)
  options.bind<CommandInterface>(DI_TYPES.Command).to(HelloCommand);
  options.bind<CommandInterface>(DI_TYPES.Command).to(CheckComponentTypesCommand);
  options.bind<CommandInterface>(DI_TYPES.Command).to(TreeShakingCommand);
});
