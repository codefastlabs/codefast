/**
 * Cross-context application errors for Result-based flows.
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

/**
 * Stable, user-facing text for values caught as `unknown`.
 */
export function messageFrom(value: unknown): string {
  if (value instanceof Error) {
    return value.message;
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "bigint" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "symbol") {
    return String(value);
  }
  if (value === null) {
    return "null";
  }
  if (value === undefined) {
    return "undefined";
  }
  try {
    const serialized = JSON.stringify(value);
    if (typeof serialized === "string") {
      return serialized;
    }
  } catch {
    // Circular structure, BigInt in tree, etc.
  }
  return "[unserializable non-Error value]";
}
