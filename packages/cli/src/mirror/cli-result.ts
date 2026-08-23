import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#/core/exit-codes";
import type { GlobalStats } from "#/mirror/domain/types";

/**
 * Maps a mirror run's stats to the process exit code.
 *
 * @since 0.3.16-canary.0
 */
export function exitCodeForMirrorSyncResult(stats: GlobalStats): number {
  return stats.packagesErrored > 0 ? CLI_EXIT_GENERAL_ERROR : CLI_EXIT_SUCCESS;
}

/**
 * Serializes a mirror run's stats as the single-line JSON summary printed under `--json`.
 *
 * @since 0.3.16-canary.0
 */
export function formatMirrorSyncJsonOutput(stats: GlobalStats, elapsedSeconds: number, write = true): string {
  return JSON.stringify({
    schemaVersion: 1 as const,
    ok: stats.packagesErrored === 0,
    write,
    elapsedSeconds,
    stats,
  });
}
