import type { Token } from "@codefast/di";
import { token } from "@codefast/di";
import type { CliCommand } from "#/lib/kernel/contracts/cli-command.contract";

export const CliCommandToken: Token<CliCommand> = token<CliCommand>("CliCommand");
