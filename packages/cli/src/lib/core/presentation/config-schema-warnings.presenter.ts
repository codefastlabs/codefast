import type { CliLogger } from "#/lib/core/application/ports/cli-io.port";

const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

/**
 * User-visible lines for non-fatal issues returned with a successfully parsed config.
 */
export function printConfigSchemaWarnings(logger: CliLogger, warnings: string[]): void {
  for (const warningMessage of warnings) {
    logger.out(`${YELLOW}\u26A0\uFE0F ${warningMessage}${RESET}`);
  }
}
