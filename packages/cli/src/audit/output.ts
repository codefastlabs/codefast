import type { AuditOutcome } from "#audit/domain/types";
import { reportAppError } from "#core/cli/result-handle";
import { logger } from "#core/logger";
import { paint } from "#core/style";

/**
 * Prints every audit of a full run under its name, then one line naming the audits that failed.
 *
 * @since 0.16.0
 */
export function presentAuditAll(outcomes: ReadonlyArray<AuditOutcome>, verbose: boolean): void {
  for (const outcome of outcomes) {
    logger.out(paint("bold", `audit ${outcome.name}`));
    if (outcome.status === "error") {
      reportAppError(outcome.error, verbose);
    } else if (outcome.status === "skipped") {
      logger.out(paint("dim", `– Skipped: ${outcome.reason}`));
    } else {
      outcome.present();
    }
    logger.out("");
  }
  const failing = outcomes.filter((outcome) => outcome.status === "findings" || outcome.status === "error");
  if (failing.length === 0) {
    const ran = outcomes.filter((outcome) => outcome.status === "clean").length;
    logger.out(paint("green", `✓ All ${ran} audits that ran are clean`));
    return;
  }
  const names = failing.map((outcome) => `${outcome.name} (${outcome.status})`).join(", ");
  logger.out(paint("red", `✗ ${failing.length} of ${outcomes.length} audits failed: ${names}`));
}
