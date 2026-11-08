import process from "node:process";

import { formatAppError } from "#core/cli/format-error";
import type { AppError } from "#core/errors";
import { CLI_EXIT_ERROR } from "#core/exit-codes";
import { logger } from "#core/logger";
import type { Result } from "#core/result";

/**
 * Prints an `AppError` to stderr, with the stack of its cause when `verbose` asks for it.
 *
 * @since 0.16.0
 */
export function reportAppError(error: AppError, verbose: boolean): void {
  logger.err(formatAppError(error));
  if (verbose && error.code === "INFRA_FAILURE" && error.cause instanceof Error && error.cause.stack !== undefined) {
    logger.err(error.cause.stack);
  }
}

/**
 * Narrows a `Result`, reporting a failure and recording the error exit code, or logging an optional success message.
 *
 * @remarks Every `AppError` means the command could not do its job, so each one exits with the error code, never the
 * code a run's own findings record.
 *
 * @since 0.3.16-canary.0
 */
export function consumeCliAppError<Value>(
  outcome: Result<Value, AppError>,
  options?: { readonly successMessage?: string; readonly verbose?: boolean | undefined },
): outcome is { readonly ok: true; readonly value: Value } {
  if (!outcome.ok) {
    reportAppError(outcome.error, options?.verbose ?? false);
    process.exitCode = CLI_EXIT_ERROR;
    return false;
  }
  if (options?.successMessage !== undefined) {
    logger.out(options.successMessage);
  }
  return true;
}
