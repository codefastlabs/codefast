import process from "node:process";
import type { AppError } from "#/core/errors";
import { formatAppError } from "#/core/cli/format-error";
import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_USAGE } from "#/core/exit-codes";
import { logger } from "#/core/logger";
import type { Result } from "#/core/result";
import { isVerboseCliDiagnostics } from "#/core/verbose-diagnostics";

function exitCodeForAppError(error: AppError): number {
  switch (error.code) {
    case "NOT_FOUND":
      return CLI_EXIT_GENERAL_ERROR;
    case "VALIDATION_ERROR":
      return CLI_EXIT_USAGE;
    case "INFRA_FAILURE":
      return CLI_EXIT_GENERAL_ERROR;
    default: {
      const exhaustive: never = error.code;
      return exhaustive;
    }
  }
}

export function handleResult<Value>(
  outcome: Result<Value, AppError>,
  onSuccess: (value: Value) => void,
): outcome is { readonly ok: true; readonly value: Value } {
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
  onSuccess(outcome.value);
  return true;
}

export function consumeCliAppError<Value>(
  outcome: Result<Value, AppError>,
  options?: { readonly successMessage?: string },
): outcome is { readonly ok: true; readonly value: Value } {
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

export async function runCliResultAsync<Value>(
  outcomePromise: Promise<Result<Value, AppError>>,
  onSuccess: (value: Value) => number | void | Promise<number | void>,
): Promise<void> {
  const outcome = await outcomePromise;
  if (!consumeCliAppError(outcome)) {
    return;
  }
  const exit = await onSuccess(outcome.value);
  process.exitCode = exit === undefined ? 0 : exit;
}
