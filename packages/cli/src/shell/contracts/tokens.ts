import { token } from "@codefast/di";
import type { CliCommand } from "#/shell/contracts/cli-command.contract";

export const CliCommandToken = token<CliCommand>("CliCommand");
