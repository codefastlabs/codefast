import type { Token } from "@codefast/di";
import { token } from "@codefast/di";
import type { CliCommand } from "#/lib/core/presentation/command.interface";

export const CliCommandToken: Token<CliCommand> = token<CliCommand>("CliCommand");
