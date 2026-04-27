import { inject, injectable } from "@codefast/di";
import type { ConfigWarningReporterPort } from "#/lib/config/application/ports/config-warning-reporter.port";
import { CliLoggerToken } from "#/lib/core/contracts/tokens";
import type { CliLogger } from "#/lib/core/application/ports/cli-io.port";

const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

@injectable([inject(CliLoggerToken)])
export class ConfigWarningReporterAdapter implements ConfigWarningReporterPort {
  constructor(private readonly logger: CliLogger) {}

  reportSchemaWarnings(warnings: readonly string[]): void {
    for (const warningMessage of warnings) {
      this.logger.out(`${YELLOW}⚠ ${warningMessage}${RESET}`);
    }
  }
}
