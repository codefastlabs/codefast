import { logger } from "#/core/logger";

const yellowAnsi = "\x1b[33m";
const resetAnsi = "\x1b[0m";

export function reportSchemaWarnings(warnings: readonly string[]): void {
  for (const warningMessage of warnings) {
    logger.out(`${yellowAnsi}⚠ ${warningMessage}${resetAnsi}`);
  }
}
