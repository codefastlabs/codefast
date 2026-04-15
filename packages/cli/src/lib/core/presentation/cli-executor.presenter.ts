import process from "node:process";
import type { AppError } from "#lib/core/domain/errors.domain";
import type { Result } from "#lib/core/domain/result.model";
import { formatAppError } from "#lib/core/presentation/format-app-error.presenter";
import type { CliLogger } from "#lib/core/application/ports/cli-io.port";
import { isVerboseInfraDiagnostics } from "#lib/core/application/utils/verbose-diagnostics.util";

function assertExhaustiveAppErrorCode(code: never): number {
  return code;
}

/**
 * Maps {@link AppError} codes to `process.exitCode` for CLI commands.
 */
export function exitCodeForAppError(error: AppError): number {
  const { code } = error;
  switch (code) {
    case "NOT_FOUND":
      return 1;
    case "VALIDATION_ERROR":
      return 1;
    case "INFRA_FAILURE":
      return 1;
    default:
      return assertExhaustiveAppErrorCode(code);
  }
}

/**
 * When `outcome` is {@link Err}, logs via {@link formatAppError}, sets `process.exitCode`, returns `false`.
 * When `Ok`, optionally logs `successMessage` to stdout and returns `true`.
 */
export function consumeCliAppError<T>(
  logger: CliLogger,
  outcome: Result<T, AppError>,
  options?: { readonly successMessage?: string },
): outcome is { readonly ok: true; readonly value: T } {
  if (!outcome.ok) {
    logger.err(formatAppError(outcome.error));
    if (
      isVerboseInfraDiagnostics() &&
      outcome.error.code === "INFRA_FAILURE" &&
      outcome.error.cause instanceof Error &&
      outcome.error.cause.stack !== undefined
    ) {
      logger.err(outcome.error.cause.stack);
    }
    process.exitCode = exitCodeForAppError(outcome.error);
    return false;
  }
  if (options?.successMessage !== undefined) {
    logger.out(options.successMessage);
  }
  return true;
}

/**
 * Awaits a use case and applies the same handling as {@link consumeCliAppError}.
 */
export async function consumeCliAppErrorAsync<T>(
  logger: CliLogger,
  outcomePromise: Promise<Result<T, AppError>>,
  options?: { readonly successMessage?: string },
): Promise<Result<T, AppError>> {
  const outcome = await outcomePromise;
  consumeCliAppError(logger, outcome, options);
  return outcome;
}

/**
 * Completes CLI handling: errors are logged and `process.exitCode` is set; success runs `onSuccess`
 * and assigns `process.exitCode` from its return value (default `0`).
 */
export function runCliResult<T>(
  logger: CliLogger,
  outcome: Result<T, AppError>,
  onSuccess: (value: T) => number | void,
): void {
  if (!consumeCliAppError(logger, outcome)) {
    return;
  }
  const exit = onSuccess(outcome.value);
  process.exitCode = exit === undefined ? 0 : exit;
}

/**
 * Async variant of {@link runCliResult}.
 */
export async function runCliResultAsync<T>(
  logger: CliLogger,
  outcomePromise: Promise<Result<T, AppError>>,
  onSuccess: (value: T) => number | void | Promise<number | void>,
): Promise<void> {
  const outcome = await outcomePromise;
  if (!consumeCliAppError(logger, outcome)) {
    return;
  }
  const exit = await onSuccess(outcome.value);
  process.exitCode = exit === undefined ? 0 : exit;
}
