import type { CliLogger } from "#/lib/core/application/ports/cli-io.port";
import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#/lib/core/domain/cli-exit-codes.domain";
import type { ArrangeRunResult } from "#/lib/arrange/domain/types.domain";

// ─── Exit code ────────────────────────────────────────────────────────────────

export function exitCodeForArrangeSyncResult(result: ArrangeRunResult): number {
  return result.hookError !== null ? CLI_EXIT_GENERAL_ERROR : CLI_EXIT_SUCCESS;
}

// ─── Human-readable output ────────────────────────────────────────────────────

export function presentArrangeSyncResult(
  logger: CliLogger,
  result: ArrangeRunResult,
  write: boolean,
): number {
  logger.out(
    `\nTotal: ${result.filePaths.length} file(s), ${result.totalFound} site(s) (cn/tv/JSX className) to review.`,
  );
  if (write) {
    logger.out(`Applied: ${result.totalChanged} site(s) updated.`);
  } else {
    logger.out(
      `(Run "apply" to write changes, or "pnpm cli:arrange-apply" / "pnpm exec codefast arrange apply")`,
    );
  }
  const shouldShowCascadeHint = write ? result.totalChanged > 0 : result.totalFound > 0;
  if (shouldShowCascadeHint) {
    logger.out(
      "Note: class order may change across concern groups — smoke-test the UI if you rely on cascade order.",
    );
  }
  if (result.hookError !== null) {
    logger.err(result.hookError);
  }
  return exitCodeForArrangeSyncResult(result);
}

// ─── JSON output (sync) ───────────────────────────────────────────────────────

export type ArrangeSyncJsonPayloadV1 = {
  readonly schemaVersion: 1;
  readonly ok: boolean;
  readonly write: boolean;
  readonly result: Omit<ArrangeRunResult, "previewPlans">;
};

export function formatArrangeSyncJsonOutput(result: ArrangeRunResult, write: boolean): string {
  const { previewPlans: _plans, ...serializableResult } = result;
  const payload: ArrangeSyncJsonPayloadV1 = {
    schemaVersion: 1,
    ok: result.hookError === null,
    write,
    result: serializableResult,
  };
  return JSON.stringify(payload);
}

// ─── JSON output (group / suggest) ───────────────────────────────────────────

export type ArrangeGroupJsonPayloadV1 = {
  readonly schemaVersion: 1;
  readonly primaryLine: string;
  readonly bucketsCommentLine: string;
};

export function formatArrangeGroupJsonOutput(output: {
  readonly primaryLine: string;
  readonly bucketsCommentLine: string;
}): string {
  const payload: ArrangeGroupJsonPayloadV1 = {
    schemaVersion: 1,
    primaryLine: output.primaryLine,
    bucketsCommentLine: output.bucketsCommentLine,
  };
  return JSON.stringify(payload);
}
