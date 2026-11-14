import type { CommandContext } from "#core/command";
import type { CodefastConfig } from "#core/config/schema";
import type { AppError } from "#core/errors";
import type { Finding } from "#core/report";
import type { Result } from "#core/result";

/**
 * What an audit runs with: the shared command context, `--fix` included.
 */
export type AuditContext = CommandContext<"fix">;

/**
 * Something a detector found in one file's text, before the run places it in that file.
 */
export interface Detection {
  readonly line: number;
  /** The offending text as written, up to its first line break; an allowlist entry matches it. */
  readonly raw: string;
  readonly reason: string;
}

/**
 * What an audit's scan found, before the allowlist applies.
 */
export interface AuditScan {
  readonly findings: ReadonlyArray<Finding>;
  readonly scannedFiles: number;
  readonly scannedPackages: number;
  /** The files `--fix` rewrote, as POSIX paths from the root. */
  readonly fixedFiles: ReadonlyArray<string>;
}

/**
 * The report of one audit: the findings past the allowlist, how many it accepted, and what the scan covered.
 */
export type AuditReport<Scan extends AuditScan = AuditScan> = Scan & { readonly allowlisted: number };

// The key an audit's section takes under `audit` in the config.
type AuditConfigKey = keyof NonNullable<CodefastConfig["audit"]>;

/**
 * One audit: its name, its config section, and the scan it runs over the target.
 */
export interface Audit<Scan extends AuditScan = AuditScan> {
  readonly name: string;
  readonly configKey: AuditConfigKey;
  readonly description: string;
  readonly scan: (context: AuditContext) => Result<Scan, AppError> | Promise<Result<Scan, AppError>>;
}

/**
 * What one audit left behind in a full `audit` run: its report, why the config turned it off, or the error that kept it
 * from running.
 */
export type AuditRun =
  | { readonly name: string; readonly status: "clean" | "findings"; readonly result: AuditReport }
  | { readonly name: string; readonly status: "skipped"; readonly reason: string }
  | { readonly name: string; readonly status: "error"; readonly error: Pick<AppError, "code" | "message"> };

/**
 * The report of a full `audit` run: one entry per audit, in a fixed order.
 */
export interface AuditAllReport {
  readonly audits: ReadonlyArray<AuditRun>;
}
