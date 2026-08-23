/**
 * A class token parsed from a source string literal, split into variant, value, and modifier.
 *
 * @since 0.5.0-canary.6
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
 * A physical class occurrence the RTL audit flags, with its suggested logical replacement.
 *
 * @since 0.5.0-canary.6
 */
export type RtlViolation = {
  readonly line: number;
  readonly raw: string;
  readonly suggestion: string;
};

/**
 * The RTL violations found in one file.
 *
 * @since 0.5.0-canary.6
 */
export type RtlFileViolations = {
  readonly relativePath: string;
  readonly violations: Array<RtlViolation>;
};

/**
 * Outcome of one `audit rtl` run.
 *
 * @since 0.5.0-canary.6
 */
export type RtlAuditResult = {
  readonly files: Array<RtlFileViolations>;
  readonly violationCount: number;
  readonly allowlistedCount: number;
  readonly scannedFileCount: number;
};

/**
 * A broken link or anchor found by the link audit.
 *
 * @since 0.5.0
 */
export type LinkBreakage = {
  readonly line: number;
  /** The link target as written, fragment included. */
  readonly raw: string;
  readonly reason: string;
};

/**
 * The link breakages found in one markdown file.
 *
 * @since 0.5.0
 */
export type LinkFileBreakages = {
  readonly relativePath: string;
  readonly breakages: Array<LinkBreakage>;
};

/**
 * Outcome of one `audit links` run.
 *
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
 *
 * @since 0.6.0
 */
export type DividerBreakage = {
  readonly line: number;
  /** The divider's opening line as written. */
  readonly raw: string;
  readonly reason: string;
};

/**
 * @see DividerBreakage
 *
 * @since 0.6.0
 */
export type DividerFileBreakages = {
  readonly relativePath: string;
  readonly breakages: Array<DividerBreakage>;
};

/**
 * Outcome of one `audit comments` run. `fixedCount` stays `0` unless `--fix` was passed.
 *
 * @since 0.6.0
 */
export type CommentAuditResult = {
  readonly files: Array<DividerFileBreakages>;
  readonly breakageCount: number;
  readonly allowlistedCount: number;
  readonly fixedCount: number;
  readonly dividerCount: number;
  readonly scannedFileCount: number;
};
