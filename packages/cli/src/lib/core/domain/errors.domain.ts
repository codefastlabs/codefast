/**
 * Cross-context application errors for Result-based use cases (CLI orchestration).
 * Does not extend the global `Error` type — instances are carried in `Result` values, not thrown.
 */

export type AppErrorCode = "NOT_FOUND" | "VALIDATION_ERROR" | "INFRA_FAILURE";

export class AppError {
  readonly name = "AppError" as const;
  readonly code: AppErrorCode;
  readonly message: string;
  readonly cause?: unknown;

  constructor(code: AppErrorCode, message: string, cause?: unknown) {
    this.code = code;
    this.message = message;
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}
