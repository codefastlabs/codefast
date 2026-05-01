import type { CliLogger } from "#/shell/application/outbound/cli-io.outbound-port";
import { CliExecutorService } from "#/shell/application/services/cli-executor.service";
import { CliVerboseDiagnosticsService } from "#/shell/application/services/cli-verbose-diagnostics.service";
import { FormatAppErrorService } from "#/shell/application/services/format-app-error.service";
import { GlobalCliOptionsParser } from "#/shell/application/services/global-cli-options-parser.service";
import { SchemaValidationService } from "#/shell/application/services/schema-validator.service";
import type { CliExecutor } from "#/shell/application/coordination/cli-executor.coordination";
import type { GlobalCliOptionsParsePort } from "#/shell/application/outbound/global-cli-options-parse.outbound-port";
import type { CliSchemaParsing } from "#/shell/application/coordination/cli-schema-parsing.coordination";

export function createShellCliTestGraph(logger: CliLogger): {
  readonly schemaValidation: CliSchemaParsing;
  readonly globalCliOptions: GlobalCliOptionsParsePort;
  readonly cliExecutor: CliExecutor;
} {
  const schemaValidation = new SchemaValidationService();
  const globalCliOptions = new GlobalCliOptionsParser(schemaValidation);
  const cliExecutor = new CliExecutorService(
    new FormatAppErrorService(),
    new CliVerboseDiagnosticsService(),
    logger,
  );
  return { schemaValidation, globalCliOptions, cliExecutor };
}
