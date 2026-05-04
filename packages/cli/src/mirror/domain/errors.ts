/**
 * @since 0.3.16-canary.0
 */
export const MirrorErrorCode = {
  FATAL: "FATAL",
  PACKAGE_WRITE: "PACKAGE_WRITE",
} as const;

/**
 * @since 0.3.16-canary.0
 */
export type MirrorErrorCode = (typeof MirrorErrorCode)[keyof typeof MirrorErrorCode];

/**
 * @since 0.3.16-canary.0
 */
export class MirrorError extends Error {
  readonly code: MirrorErrorCode;

  constructor(code: MirrorErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "MirrorError";
    this.code = code;
  }
}
