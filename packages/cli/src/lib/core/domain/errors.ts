/**
 * Cross-context application errors for Result-based use cases (CLI orchestration).
 */

export type AppErrorCode = "NOT_FOUND" | "VALIDATION_ERROR" | "INFRA_FAILURE";

export type AppError = {
  readonly code: AppErrorCode;
  readonly message: string;
  readonly cause?: unknown;
};

export function appError(code: AppErrorCode, message: string, cause?: unknown): AppError {
  if (cause === undefined) {
    return { code, message };
  }
  return { code, message, cause };
}
