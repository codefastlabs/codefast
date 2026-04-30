import { inject, injectable } from "@codefast/di";
import type { ConfigWarningReporterPort } from "#/domains/config/application/ports/config-warning-reporter.port";
import { CliLoggerToken } from "#/shell/application/cli-runtime.tokens";
import type { CliLogger } from "#/shell/application/ports/cli-io.port";

@injectable([inject(CliLoggerToken)])
export class ConfigWarningReporterAdapter implements ConfigWarningReporterPort {
  private readonly yellowAnsi = "\x1b[33m";
  private readonly resetAnsi = "\x1b[0m";

  constructor(private readonly logger: CliLogger) {}

  reportSchemaWarnings(warnings: readonly string[]): void {
    for (const warningMessage of warnings) {
      this.logger.out(`${this.yellowAnsi}⚠ ${warningMessage}${this.resetAnsi}`);
    }
  }
}
