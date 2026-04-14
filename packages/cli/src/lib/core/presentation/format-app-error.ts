import type { AppError } from "#lib/core/domain/errors";

function assertExhaustiveAppErrorCode(code: never): string {
  return `Unhandled error code: ${String(code)}`;
}

/**
 * Stable, user-facing line for CLI output. Exhaustive over every `AppError["code"]`.
 */
export function formatAppError(error: AppError): string {
  const { code, message } = error;
  switch (code) {
    case "NOT_FOUND":
      return `[NOT_FOUND] ${message}`;
    case "VALIDATION_ERROR":
      return `[VALIDATION_ERROR] ${message}`;
    case "INFRA_FAILURE":
      return `[INFRA_FAILURE] ${message}`;
    default:
      return assertExhaustiveAppErrorCode(code);
  }
}
