import type { CliLoggerPort } from "#/shell/application/ports/outbound/cli-logger.port";
import { CliExecutorService } from "#/shell/application/services/cli-executor.service";
import { CliVerboseDiagnosticsAdapter } from "#/shell/infrastructure/adapters/cli-verbose-diagnostics.adapter";
import { FormatAppErrorAdapter } from "#/shell/infrastructure/adapters/format-app-error.adapter";
import { GlobalCliOptionsParserAdapter } from "#/shell/infrastructure/adapters/global-cli-options-parser.adapter";
import { SchemaValidatorService } from "#/shell/application/services/schema-validator.service";
import type { CliExecutor } from "#/shell/application/coordination/cli-executor.coordination";
import type { GlobalCliOptionsParsePort } from "#/shell/application/ports/outbound/global-cli-options-parse.port";
import type { CliSchemaParsing } from "#/shell/application/coordination/cli-schema-parsing.coordination";

export function createShellCliTestGraph(logger: CliLoggerPort): {
  readonly schemaValidation: CliSchemaParsing;
  readonly globalCliOptions: GlobalCliOptionsParsePort;
  readonly cliExecutor: CliExecutor;
} {
  const schemaValidation = new SchemaValidatorService();
  const globalCliOptions = new GlobalCliOptionsParserAdapter(schemaValidation);
  const cliExecutor = new CliExecutorService(
    new FormatAppErrorAdapter(),
    new CliVerboseDiagnosticsAdapter(),
    logger,
  );
  return { schemaValidation, globalCliOptions, cliExecutor };
}
