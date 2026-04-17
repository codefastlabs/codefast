import { token } from "@codefast/di";
import type { CliCommand } from "#/lib/core/presentation/command.interface";

export const COMMAND_TOKEN = token<CliCommand>("CliCommand");
