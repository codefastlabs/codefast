import type { BenchScenarioTier } from "#/child/bench-scenario";
import { DEFAULT_BENCH_SCENARIO_TIER } from "#/child/bench-scenario";
import type { BenchRunShape } from "#/shared/env-keys";
import type { Fingerprint, ScenarioTrialResult, TrialPayload } from "#/shared/protocol";

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
  /** Absent on rows written before tiers existed, which were all contract rows. */
  readonly tier?: BenchScenarioTier;
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
 *
 * @since 0.9.0
 */
export function benchConfigKeyOfRow(row: JsonlBenchObservationRow): string {
  return `${row.isolated ? "iso" : "shared"}|${row.mode}|t${row.trialCount}`;
}

/**
 * Derives a human label for the run configuration a row was measured under.
 *
 * @since 0.9.0
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
    tier: row.tier ?? DEFAULT_BENCH_SCENARIO_TIER,
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

/**
 * One library's fingerprint and per-trial payloads reconstructed from its observation rows.
 *
 * @since 0.9.0
 */
export interface LibraryObservations {
  readonly fingerprint: Fingerprint;
  readonly trials: ReadonlyArray<TrialPayload>;
}

/**
 * A run reconstructed from its `observations.jsonl`: each library's payloads and the run's shape.
 *
 * @since 0.9.0
 */
export interface ParsedRun {
  readonly libraries: Map<string, LibraryObservations>;
  /** The execution shape and profile stamped on the rows; `undefined` when no row was valid. */
  readonly shape: BenchRunShape | undefined;
}

/**
 * Reconstructs a run from an `observations.jsonl` file — each library's fingerprint and per-trial
 * payloads plus the run shape — skipping any line that is not a valid observation row.
 *
 * @remarks The inverse of {@link writeJsonlRun}: it recovers what a report needs from the one file a
 * run persists, so the comparison document and markdown can be derived on demand.
 *
 * @since 0.9.0
 */
export function parseRunObservations(jsonlContent: string): ParsedRun {
  const grouped = new Map<string, { fingerprint: Fingerprint; trials: Map<number, Array<ScenarioTrialResult>> }>();
  let shape: BenchRunShape | undefined;
  for (const line of jsonlContent.split("\n")) {
    if (line.trim().length === 0) {
      continue;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      continue;
    }
    if (!isJsonlBenchObservationRow(parsed)) {
      continue;
    }
    shape ??= { isolated: parsed.isolated, mode: parsed.mode };
    let bucket = grouped.get(parsed.libraryName);
    if (bucket === undefined) {
      bucket = { fingerprint: jsonlBenchObservationRowToFingerprint(parsed), trials: new Map() };
      grouped.set(parsed.libraryName, bucket);
    }
    const scenarioResult = jsonlBenchObservationRowToScenarioTrialResult(parsed);
    const trialScenarios = bucket.trials.get(parsed.trialIndex);
    if (trialScenarios === undefined) {
      bucket.trials.set(parsed.trialIndex, [scenarioResult]);
    } else {
      trialScenarios.push(scenarioResult);
    }
  }
  const libraries = new Map<string, LibraryObservations>();
  for (const [libraryName, bucket] of grouped) {
    const trials = [...bucket.trials.entries()]
      .toSorted((left, right) => left[0] - right[0])
      .map(([trialIndex, scenarios]) => ({ trialIndex, scenarios }));
    libraries.set(libraryName, { fingerprint: bucket.fingerprint, trials });
  }
  return { libraries, shape };
}
