import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#/core/exit-codes";
import type { PackSlimRunStats } from "#/pack-slim/domain/types";

/**
 * Maps a pack-slim run's stats to the process exit code.
 *
 * @since 0.8.1
 */
export function exitCodeForPackSlimResult(stats: PackSlimRunStats): number {
  return stats.packagesErrored > 0 ? CLI_EXIT_GENERAL_ERROR : CLI_EXIT_SUCCESS;
}

/**
 * Serializes a pack-slim run's stats as the single-line JSON summary printed under `--json`.
 *
 * @since 0.8.1
 */
export function formatPackSlimJsonOutput(stats: PackSlimRunStats, elapsedSeconds: number, write = true): string {
  return JSON.stringify({
    schemaVersion: 1 as const,
    ok: stats.packagesErrored === 0,
    write,
    elapsedSeconds,
    stats,
  });
}
