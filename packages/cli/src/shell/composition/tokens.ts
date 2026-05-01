import { token } from "@codefast/di";
import type { CliCommand } from "#/shell/application/ports/primary/cli-command.port";

export const CliCommandToken = token<CliCommand>("CliCommand");
