import type { AppError } from "#/core/errors";

/**
 * @since 0.3.16-canary.0
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
    default: {
      const exhaustive: never = code;
      return `Unhandled error code: ${String(exhaustive)}`;
    }
  }
}
