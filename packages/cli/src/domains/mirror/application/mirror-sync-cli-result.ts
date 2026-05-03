import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#/shell/domain/cli-exit-codes.domain";
import type { GlobalStats } from "#/domains/mirror/domain/types.domain";

export function exitCodeForMirrorSyncResult(stats: GlobalStats): number {
  return stats.packagesErrored > 0 ? CLI_EXIT_GENERAL_ERROR : CLI_EXIT_SUCCESS;
}

export function formatMirrorSyncJsonOutput(stats: GlobalStats, elapsedSeconds: number): string {
  return JSON.stringify({
    schemaVersion: 1 as const,
    ok: stats.packagesErrored === 0,
    elapsedSeconds,
    stats,
  });
}
