import type { Fingerprint, ScenarioTrialResult } from "#/shared/protocol";

/**
 * One serialised observation line in bench `observations.jsonl` ({@link writeJsonlRun} output).
 *
 * @since 0.3.16-canary.0
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
  readonly excludeFromAggregates?: boolean;
  readonly batch: number;
  readonly what: string;
  readonly hzPerIteration: number;
  readonly hzPerOp: number;
  readonly meanMs: number;
  readonly p75Ms: number;
  readonly p99Ms: number;
  readonly p999Ms: number;
  readonly samples: number;
  // Configuration identity of the run that produced this row: its execution shape and timing profile.
  readonly isolated: boolean;
  readonly mode: "fast" | "default" | "full";
  readonly trialCount: number;
}

/**
 * Whether a parsed JSONL value carries the fields the report pipeline dereferences.
 *
 * @remarks The boundary guard for readers of `observations.jsonl` — a truncated write or a
 * schema-drifted line must be counted and skipped where it enters, not crash aggregation.
 *
 * @since 0.7.2
 */
export function isJsonlBenchObservationRow(value: unknown): value is JsonlBenchObservationRow {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  const stringFields = [
    "timestampIso",
    "libraryName",
    "libraryVersion",
    "nodeVersion",
    "v8Version",
    "platform",
    "arch",
    "cpuModel",
    "nodeOptions",
    "scenarioId",
    "group",
    "what",
  ] as const;
  const numberFields = [
    "cpuCount",
    "trialIndex",
    "batch",
    "hzPerIteration",
    "hzPerOp",
    "meanMs",
    "p75Ms",
    "p99Ms",
    "p999Ms",
    "samples",
  ] as const;
  const modeValue = candidate["mode"];
  const configFieldsOk =
    typeof candidate["isolated"] === "boolean" &&
    typeof candidate["trialCount"] === "number" &&
    (modeValue === "fast" || modeValue === "default" || modeValue === "full");
  return (
    configFieldsOk &&
    stringFields.every((field) => typeof candidate[field] === "string") &&
    numberFields.every((field) => typeof candidate[field] === "number") &&
    typeof candidate["gcExposed"] === "boolean" &&
    typeof candidate["stress"] === "boolean"
  );
}

/**
 * Derives a stable partition key for the run configuration a row was measured under.
 *
 * @remarks Runs sharing a key are comparable; a key change marks a boundary a chart must not cross.
 */
export function benchConfigKeyOfRow(row: JsonlBenchObservationRow): string {
  return `${row.isolated ? "iso" : "shared"}|${row.mode}|t${row.trialCount}`;
}

/**
 * Derives a human label for the run configuration a row was measured under.
 */
export function benchConfigLabelOfRow(row: JsonlBenchObservationRow): string {
  const shape = row.isolated ? "isolated" : "shared";
  const trials = row.trialCount === 1 ? "1 trial" : `${row.trialCount} trials`;
  return `${shape} · ${row.mode} · ${trials}`;
}

/**
 * Maps JSONL flattened fields onto a {@link Fingerprint}.
 *
 * @since 0.3.16-canary.0
 */
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

/**
 * Maps JSONL flattened fields onto a {@link ScenarioTrialResult}.
 *
 * @since 0.3.16-canary.0
 */
export function jsonlBenchObservationRowToScenarioTrialResult(row: JsonlBenchObservationRow): ScenarioTrialResult {
  return {
    id: row.scenarioId,
    group: row.group,
    stress: row.stress,
    excludeFromAggregates: row.excludeFromAggregates === true,
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
