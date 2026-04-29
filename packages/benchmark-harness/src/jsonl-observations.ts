import type { Fingerprint, ScenarioTrialResult } from "#/protocol";

/**
 * One serialised observation line in bench `observations.jsonl` ({@link writeBenchJsonlRun} output).
 */
export interface JsonlBenchObservationRow {
  readonly timestampIso: string;
  readonly libraryName: string;
  readonly libraryVersion: string;
  readonly nodeVersion: string;
  readonly v8Version: string;
  readonly platform: string;
  readonly arch: string;
  readonly cpuModel: string;
  readonly cpuCount: number;
  readonly nodeOptions: string;
  readonly gcExposed: boolean;
  readonly trialIndex: number;
  readonly scenarioId: string;
  readonly group: string;
  readonly stress: boolean;
  readonly batch: number;
  readonly what: string;
  readonly hzPerIteration: number;
  readonly hzPerOp: number;
  readonly meanMs: number;
  readonly p75Ms: number;
  readonly p99Ms: number;
  readonly p999Ms: number;
  readonly samples: number;
}

/** Maps JSONL flattened fields onto a {@link Fingerprint}. */
export function jsonlBenchObservationRowToFingerprint(row: JsonlBenchObservationRow): Fingerprint {
  return {
    nodeVersion: row.nodeVersion,
    v8Version: row.v8Version,
    platform: row.platform,
    arch: row.arch,
    cpuModel: row.cpuModel,
    cpuCount: row.cpuCount,
    nodeOptions: row.nodeOptions,
    libraryName: row.libraryName,
    libraryVersion: row.libraryVersion,
    gcExposed: row.gcExposed,
    timestampIso: row.timestampIso,
  };
}

export function jsonlBenchObservationRowToScenarioTrialResult(
  row: JsonlBenchObservationRow,
): ScenarioTrialResult {
  return {
    id: row.scenarioId,
    group: row.group,
    stress: row.stress,
    batch: row.batch,
    what: row.what,
    hzPerIteration: row.hzPerIteration,
    hzPerOp: row.hzPerOp,
    meanMs: row.meanMs,
    p75Ms: row.p75Ms,
    p99Ms: row.p99Ms,
    p999Ms: row.p999Ms,
    samples: row.samples,
  };
}
