export const MirrorErrorCode = {
  FATAL: "FATAL",
  PACKAGE_WRITE: "PACKAGE_WRITE",
} as const;

export type MirrorErrorCode = (typeof MirrorErrorCode)[keyof typeof MirrorErrorCode];

export class MirrorError extends Error {
  readonly code: MirrorErrorCode;

  constructor(code: MirrorErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "MirrorError";
    this.code = code;
  }
}
