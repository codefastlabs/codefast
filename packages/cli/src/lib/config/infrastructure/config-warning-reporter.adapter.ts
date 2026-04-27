import { inject, injectable } from "@codefast/di";
import type { ConfigWarningReporterPort } from "#/lib/config/application/ports/config-warning-reporter.port";
import { CliLoggerToken } from "#/lib/core/contracts/tokens";
import type { CliLogger } from "#/lib/core/application/ports/cli-io.port";
import { printConfigSchemaWarnings } from "#/lib/infrastructure/config-reporter.adapter";

@injectable([inject(CliLoggerToken)])
export class ConfigWarningReporterAdapter implements ConfigWarningReporterPort {
  constructor(private readonly logger: CliLogger) {}

  reportSchemaWarnings(warnings: readonly string[]): void {
    printConfigSchemaWarnings(this.logger, [...warnings]);
  }
}
