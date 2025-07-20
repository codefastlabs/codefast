/**
 * Commands Module
 *
 * InversifyJS module for binding commands layer dependencies.
 * Following explicit architecture guidelines for CLI applications.
 */

import { ContainerModule } from "inversify";

import { CommandHandler } from "@/commands/command-handler";
import { TYPES } from "@/di/types";

export const commandsModule = new ContainerModule((options) => {
  // Command Handler
  options.bind<CommandHandler>(TYPES.CommandHandler).to(CommandHandler);
});
