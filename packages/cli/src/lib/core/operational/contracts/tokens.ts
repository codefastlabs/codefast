import type { Token } from "@codefast/di";
import { token } from "@codefast/di";
import type { CliFs, CliLogger } from "#/lib/core/application/ports/cli-io.port";
import type { CliPath } from "#/lib/core/application/ports/path.port";

export const CliFsToken: Token<CliFs> = token<CliFs>("CliFs");
export const CliLoggerToken: Token<CliLogger> = token<CliLogger>("CliLogger");
export const CliPathToken: Token<CliPath> = token<CliPath>("CliPath");
