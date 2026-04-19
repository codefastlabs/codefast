import type { GlobalStats } from "#/lib/mirror/domain/types.domain";

/** Machine-readable result for `codefast mirror sync --json` (stdout, one object per run). */
export type MirrorSyncJsonPayloadV1 = {
  readonly schemaVersion: 1;
  /** `true` when no package-level errors were recorded (`packagesErrored === 0`). */
  readonly ok: boolean;
  readonly elapsedSeconds: number;
  readonly stats: GlobalStats;
};

export function formatMirrorSyncJsonOutput(stats: GlobalStats, elapsedSeconds: number): string {
  const payload: MirrorSyncJsonPayloadV1 = {
    schemaVersion: 1,
    ok: stats.packagesErrored === 0,
    elapsedSeconds,
    stats,
  };
  return JSON.stringify(payload);
}
