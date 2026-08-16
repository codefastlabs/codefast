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

/**
 * @since 0.5.0
 */
export type LinkBreakage = {
  readonly line: number;
  /** The link target as written, fragment included. */
  readonly raw: string;
  readonly reason: string;
};

/**
 * @since 0.5.0
 */
export type LinkFileBreakages = {
  readonly relativePath: string;
  readonly breakages: Array<LinkBreakage>;
};

/**
 * @since 0.5.0
 */
export type LinkAuditResult = {
  readonly files: Array<LinkFileBreakages>;
  readonly breakageCount: number;
  readonly allowlistedCount: number;
  readonly linkCount: number;
  readonly scannedFileCount: number;
};

/**
 * A section divider that does not match the repo's one allowed form. Always `--fix`-able.
 */
export type DividerBreakage = {
  readonly line: number;
  /** The divider's opening line as written. */
  readonly raw: string;
  readonly reason: string;
};

/**
 * @see DividerBreakage
 */
export type DividerFileBreakages = {
  readonly relativePath: string;
  readonly breakages: Array<DividerBreakage>;
};

/**
 * Outcome of one `audit comments` run. `fixedCount` stays `0` unless `--fix` was passed.
 */
export type CommentAuditResult = {
  readonly files: Array<DividerFileBreakages>;
  readonly breakageCount: number;
  readonly allowlistedCount: number;
  readonly fixedCount: number;
  readonly dividerCount: number;
  readonly scannedFileCount: number;
};
