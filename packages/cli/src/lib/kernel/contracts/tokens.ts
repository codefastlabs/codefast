import { token } from "@codefast/di";
import type { CliCommand } from "#/lib/kernel/contracts/cli-command.contract";

export const CliCommandToken = token<CliCommand>("CliCommand");
