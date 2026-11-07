import { logger } from "#core/logger";
import { paint } from "#core/style";

/**
 * Prints each config schema warning as a highlighted line.
 *
 * @since 0.3.16-canary.0
 */
export function reportSchemaWarnings(warnings: ReadonlyArray<string>): void {
  for (const warningMessage of warnings) {
    logger.out(paint("yellow", `⚠ ${warningMessage}`));
  }
}
