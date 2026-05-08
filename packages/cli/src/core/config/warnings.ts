import { logger } from "#/core/logger";

const yellowAnsi = "\x1b[33m";
const resetAnsi = "\x1b[0m";

/**
 * @since 0.3.16-canary.0
 */
export function reportSchemaWarnings(warnings: ReadonlyArray<string>): void {
  for (const warningMessage of warnings) {
    logger.out(`${yellowAnsi}⚠ ${warningMessage}${resetAnsi}`);
  }
}
