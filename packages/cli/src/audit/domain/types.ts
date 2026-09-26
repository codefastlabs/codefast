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
 * An import-policy violation: a banned import form (namespace / default / named), or an implicit
 * UMD-global type reference under a name nothing in the file imports.
 *
 * @since 0.10.0
 */
export type ImportPolicyViolation = {
  readonly line: number;
  /** The offending source text — the import statement or the qualified type name. */
  readonly raw: string;
  readonly reason: string;
};

/**
 * The import-policy violations found in one file.
 *
 * @since 0.10.0
 */
export type ImportPolicyFileViolations = {
  readonly relativePath: string;
  readonly violations: Array<ImportPolicyViolation>;
};

/**
 * Outcome of one `audit imports` run.
 *
 * @since 0.10.0
 */
export type ImportsAuditResult = {
  readonly files: Array<ImportPolicyFileViolations>;
  readonly violationCount: number;
  readonly allowlistedCount: number;
  readonly scannedFileCount: number;
};

/**
 * A double assertion through `unknown` or `any`, or a directive that keeps one without cause.
 *
 * @since 0.13.0
 */
export type AssertionViolation = {
  readonly line: number;
  /** The assertion or the directive as written, up to its first line break. */
  readonly raw: string;
  readonly reason: string;
};

/**
 * The type-assertion violations found in one file.
 *
 * @since 0.13.0
 */
export type AssertionFileViolations = {
  readonly relativePath: string;
  readonly violations: Array<AssertionViolation>;
};

/**
 * Outcome of one `audit assertions` run.
 *
 * @since 0.13.0
 */
export type AssertionAuditResult = {
  readonly files: Array<AssertionFileViolations>;
  readonly violationCount: number;
  readonly allowlistedCount: number;
  readonly scannedFileCount: number;
};

/**
 * A `token()`, `tag()` or module display name that breaks the display-name convention.
 *
 * @since 0.9.0
 */
export type DisplayNameViolation = {
  readonly line: number;
  /** The call as written, through its closing quote. */
  readonly raw: string;
  readonly reason: string;
};

/**
 * The display-name violations found in one file.
 *
 * @since 0.9.0
 */
export type DisplayNameFileViolations = {
  readonly relativePath: string;
  readonly violations: Array<DisplayNameViolation>;
};

/**
 * Outcome of one `audit display-names` run.
 *
 * @since 0.9.0
 */
export type DisplayNameAuditResult = {
  readonly files: Array<DisplayNameFileViolations>;
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

/**
 * A `#/`-prefixed internal import specifier — valid to the in-repo runners but rejected by Node's ESM
 * resolver on the supported floor, so it breaks the published package.
 *
 * @since 0.12.0
 */
export type LegacySubpathImport = {
  readonly line: number;
  /** The specifier as written, quotes included. */
  readonly raw: string;
};

/**
 * The `#/` imports found in one source file.
 *
 * @since 0.12.0
 */
export type LegacySubpathFile = {
  readonly relativePath: string;
  readonly imports: Array<LegacySubpathImport>;
};

/**
 * A published package whose slimmed manifest exports or imports a target it does not ship.
 *
 * @since 0.12.0
 */
export type UnshippedTargetViolation = {
  readonly packageName: string;
  readonly field: string;
  readonly subpath: string;
  readonly target: string;
};

/**
 * A path a stylesheet registers with Tailwind's `@source`, as written.
 *
 * @since 0.13.0
 */
export type StylesheetSource = {
  readonly line: number;
  readonly pattern: string;
};

/**
 * A shipped stylesheet whose `@source` paths reach no file its package's tarball ships.
 *
 * @since 0.13.0
 */
export type UnreachableStylesheetViolation = {
  readonly packageName: string;
  /** Repo-relative path of the stylesheet. */
  readonly stylesheet: string;
  readonly sources: Array<StylesheetSource>;
  /** The `files` entries missing on disk, which is how an unbuilt `dist` shows up. */
  readonly missingFilesEntries: Array<string>;
};

/**
 * Outcome of one `audit publish` run.
 *
 * @since 0.12.0
 */
export type PublishAuditResult = {
  readonly legacyImportFiles: Array<LegacySubpathFile>;
  readonly unshipped: Array<UnshippedTargetViolation>;
  readonly unreachableStylesheets: Array<UnreachableStylesheetViolation>;
  readonly legacyImportCount: number;
  readonly scannedFileCount: number;
  readonly packageCount: number;
};
