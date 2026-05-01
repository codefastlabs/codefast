import { inject, injectable } from "@codefast/di";
import type { ConfigWarningReporterPort } from "#/domains/config/application/ports/outbound/config-warning-reporter.port";
import { CliLoggerPortToken } from "#/shell/application/cli-runtime.tokens";
import type { CliLoggerPort } from "#/shell/application/ports/outbound/cli-logger.port";

@injectable([inject(CliLoggerPortToken)])
export class ConfigWarningReporterAdapter implements ConfigWarningReporterPort {
  private readonly yellowAnsi = "\x1b[33m";
  private readonly resetAnsi = "\x1b[0m";

  constructor(private readonly logger: CliLoggerPort) {}

  reportSchemaWarnings(warnings: readonly string[]): void {
    for (const warningMessage of warnings) {
      this.logger.out(`${this.yellowAnsi}⚠ ${warningMessage}${this.resetAnsi}`);
    }
  }
}
