/**
 * Structured errors for the arrange CLI library (throw from lib; handle exit in commands).
 */

export const ArrangeErrorCode = {
  TARGET_NOT_FOUND: "TARGET_NOT_FOUND",
  INVALID_INPUT: "INVALID_INPUT",
  INTERNAL: "INTERNAL",
} as const;

export type ArrangeErrorCode = (typeof ArrangeErrorCode)[keyof typeof ArrangeErrorCode];

export class ArrangeError extends Error {
  readonly code: ArrangeErrorCode;

  constructor(code: ArrangeErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ArrangeError";
    this.code = code;
  }
}
