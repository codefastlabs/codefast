import { token } from "@codefast/di";
import type { CliCommandPort } from "#/shell/application/ports/primary/cli-command.port";

export const CommandPortToken = token<CliCommandPort>("CliCommandPort");
