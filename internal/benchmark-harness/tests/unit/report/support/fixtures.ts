import { buildLibraryReport } from "#/report/aggregate";
import type { ComparisonLibrary } from "#/report/comparison";
import type { Fingerprint, ScenarioTrialResult, TrialPayload } from "#/shared/protocol";

/** A fingerprint for a library with an optional environment override. */
export function fingerprint(libraryName: string, overrides: Partial<Fingerprint> = {}): Fingerprint {
  return {
    nodeVersion: "26.1.0",
    v8Version: "14.6",
    platform: "darwin",
    arch: "arm64",
    cpuModel: "Apple M3 Max",
    cpuCount: 14,
    nodeOptions: "--no-warnings",
    libraryName,
    libraryVersion: "1.0.0",
    gcExposed: false,
    timestampIso: "2026-09-12T00:00:00.000Z",
    ...overrides,
  };
}

/** One measured scenario at a throughput, in a group. */
export function scenario(
  id: string,
  hzPerOp: number,
  group = "micro",
  overrides: Partial<ScenarioTrialResult> = {},
): ScenarioTrialResult {
  return {
    id,
    group,
    stress: false,
    excludeFromAggregates: false,
    batch: 1,
    what: id,
    hzPerIteration: hzPerOp,
    hzPerOp,
    meanMs: 1,
    p75Ms: 1,
    p99Ms: 1,
    p999Ms: 1,
    samples: 10,
    ...overrides,
  };
}

/** One library's trials, each holding the same scenarios. */
export function trials(scenarios: ReadonlyArray<ScenarioTrialResult>, trialCount = 1): Array<TrialPayload> {
  return Array.from({ length: trialCount }, (_, trialIndex) => ({ trialIndex, scenarios }));
}

/** A comparison library built from one trial. */
export function library(
  displayName: string,
  scenarios: ReadonlyArray<ScenarioTrialResult>,
  options: { shortName?: string; sanityFailures?: ReadonlyArray<string>; fingerprint?: Fingerprint } = {},
): ComparisonLibrary {
  const print = options.fingerprint ?? fingerprint(displayName);
  return {
    report: buildLibraryReport(print, trials(scenarios), options.sanityFailures ?? []),
    displayName,
    shortName: options.shortName ?? displayName.slice(0, 3),
  };
}
