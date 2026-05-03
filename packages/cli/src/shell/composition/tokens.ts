import { token } from "@codefast/di";
import type { CommandPort } from "#/shell/application/ports/primary/command.port";

export const CommandPortToken = token<CommandPort>("CommandPort");
