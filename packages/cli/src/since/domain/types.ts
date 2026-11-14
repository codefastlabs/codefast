import type { Finding, PackageOutcome } from "#core/report";

/**
 * An exported declaration left unstamped: it has no doc block, and a `//` comment holds the line above it.
 *
 * @remarks A block written there would stack under a note or split a directive from the code it governs, so the
 * writer leaves the whole file as it is until a person writes that doc block.
 */
export interface BlockedDeclaration {
  readonly filePath: string;
  readonly line: number;
  readonly name: string;
}

/**
 * What stamping one file did.
 */
export interface SinceFileResult {
  readonly filePath: string;
  readonly stampedDeclarations: number;
  readonly blockedDeclarations: ReadonlyArray<BlockedDeclaration>;
  readonly changed: boolean;
}

/**
 * What `since:stamp` did to one package.
 */
export interface SincePackageOutcome extends PackageOutcome {
  /** The version stamped, read from the package's own manifest. */
  readonly version: string | null;
  readonly filesScanned: number;
  readonly stampedDeclarations: number;
}

/**
 * The report of a `since:stamp` run: one outcome per package, and every declaration left unstamped.
 */
export interface SinceStampReport {
  readonly packages: ReadonlyArray<SincePackageOutcome>;
  readonly findings: ReadonlyArray<Finding>;
}
