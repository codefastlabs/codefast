import type { AuditOutcome } from "#audit/domain/types";
import { CLI_EXIT_ERROR, CLI_EXIT_FAILURE, CLI_EXIT_SUCCESS } from "#core/exit-codes";

/**
 * The machine output every audit prints for `--json`.
 *
 * @since 0.16.0
 */
export function formatAuditJson(result: unknown, rootDir: string, clean: boolean): string {
  return JSON.stringify({ schemaVersion: 2 as const, ok: clean, rootDir, result });
}

/**
 * The exit code every audit records: `1` while findings remain.
 *
 * @since 0.16.0
 */
export function auditExitCode(clean: boolean): number {
  return clean ? CLI_EXIT_SUCCESS : CLI_EXIT_FAILURE;
}

/**
 * The machine output of a full `audit` run: one entry per audit, with its result, skip reason or error.
 *
 * @since 0.16.0
 */
export function formatAuditAllJson(outcomes: ReadonlyArray<AuditOutcome>, rootDir: string): string {
  return JSON.stringify({
    schemaVersion: 2 as const,
    ok: outcomes.every((outcome) => outcome.status === "clean" || outcome.status === "skipped"),
    rootDir,
    audits: outcomes.map((outcome) => {
      switch (outcome.status) {
        case "error":
          return {
            name: outcome.name,
            status: outcome.status,
            error: { code: outcome.error.code, message: outcome.error.message },
          };
        case "skipped":
          return { name: outcome.name, status: outcome.status, reason: outcome.reason };
        default:
          return { name: outcome.name, status: outcome.status, result: outcome.result };
      }
    }),
  });
}

/**
 * The exit code a full `audit` run records: an audit that could not run outranks one with findings.
 *
 * @since 0.16.0
 */
export function auditAllExitCode(outcomes: ReadonlyArray<Pick<AuditOutcome, "status">>): number {
  if (outcomes.some((outcome) => outcome.status === "error")) {
    return CLI_EXIT_ERROR;
  }
  return outcomes.some((outcome) => outcome.status === "findings") ? CLI_EXIT_FAILURE : CLI_EXIT_SUCCESS;
}
