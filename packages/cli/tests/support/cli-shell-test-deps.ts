import type { CliLogger } from "#/shell/application/ports/cli-io.port";
import { CliExecutorService } from "#/shell/application/services/cli-executor.service";
import { CliVerboseDiagnosticsService } from "#/shell/application/services/cli-verbose-diagnostics.service";
import { FormatAppErrorService } from "#/shell/application/services/format-app-error.service";
import { GlobalCliOptionsParser } from "#/shell/application/services/global-cli-options-parser.service";
import { SchemaValidationService } from "#/shell/application/services/schema-validator.service";
import type { CliExecutorPort } from "#/shell/application/ports/cli-executor.port";
import type { GlobalCliOptionsParsePort } from "#/shell/application/ports/global-cli-options-parse.port";
import type { SchemaValidationPort } from "#/shell/application/ports/schema-validation.port";

export function createShellCliTestGraph(logger: CliLogger): {
  readonly schemaValidation: SchemaValidationPort;
  readonly globalCliOptions: GlobalCliOptionsParsePort;
  readonly cliExecutor: CliExecutorPort;
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
