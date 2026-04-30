import process from "node:process";
import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_USAGE } from "#/shell/domain/cli-exit-codes.domain";
import type { AppError } from "#/shell/domain/errors.domain";
import type { Result } from "#/shell/domain/result.model";
import { formatAppError } from "#/shell/presentation/format-app-error.presenter";
import type { CliLogger } from "#/shell/application/ports/cli-io.port";
import { isVerboseCliDiagnostics } from "#/shell/application/cli-verbose-diagnostics.policy";

function assertExhaustiveAppErrorCode(code: never): number {
  return code;
}

/**
 * Maps {@link AppError} codes to `process.exitCode` for CLI commands.
 */
function exitCodeForAppError(error: AppError): number {
  const { code } = error;
  switch (code) {
    case "NOT_FOUND":
      return CLI_EXIT_GENERAL_ERROR;
    case "VALIDATION_ERROR":
      return CLI_EXIT_USAGE;
    case "INFRA_FAILURE":
      return CLI_EXIT_GENERAL_ERROR;
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
      isVerboseCliDiagnostics() &&
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
 * Async CLI result handling that sets `process.exitCode` from success/error outcome.
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
