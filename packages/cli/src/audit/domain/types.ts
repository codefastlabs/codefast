/**
 * @since 1.0.0-canary.7
 */
export type RtlClassToken = {
  readonly raw: string;
  readonly token: string;
  readonly variant: string | null;
  readonly value: string;
  readonly modifier: string | null;
  readonly line: number;
};

/**
 * @since 1.0.0-canary.7
 */
export type RtlViolation = {
  readonly line: number;
  readonly raw: string;
  readonly suggestion: string;
};

/**
 * @since 1.0.0-canary.7
 */
export type RtlFileViolations = {
  readonly relativePath: string;
  readonly violations: Array<RtlViolation>;
};

/**
 * @since 1.0.0-canary.7
 */
export type RtlAuditResult = {
  readonly files: Array<RtlFileViolations>;
  readonly violationCount: number;
  readonly allowlistedCount: number;
  readonly scannedFileCount: number;
};
