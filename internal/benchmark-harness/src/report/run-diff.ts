/** The change since the previous comparable run: per scenario against noise, and per competitor aggregate. */
import { readRunObservations, resolveRunDirectory } from "#/parent/bench-run-artifacts";
import { buildLibraryReport } from "#/report/aggregate";
import type { ComparisonLibrary } from "#/report/comparison";
import { summarizeComparison } from "#/report/comparison";
import { parseRunObservations } from "#/report/jsonl";
import { isThroughputAboveNoiseCeiling, NOISY_IQR_FRACTION } from "#/report/reliability";
import type { BenchRunShape } from "#/shared/env-keys";
import type { Fingerprint, TrialPayload } from "#/shared/protocol";

/**
 * A run read back from disk to diff against.
 */
export interface PreviousRun {
  readonly runId: string;
  readonly shape: BenchRunShape;
  readonly trialCount: number;
  readonly libraries: ReadonlyMap<
    string,
    { readonly fingerprint: Fingerprint; readonly trials: ReadonlyArray<TrialPayload> }
  >;
}

/**
 * The run a diff is computed for.
 */
export interface CurrentRun {
  readonly pivot: ComparisonLibrary;
  readonly competitors: ReadonlyArray<ComparisonLibrary>;
  readonly shape: BenchRunShape;
  readonly trialCount: number;
}

/**
 * One scenario's pivot throughput now against then.
 */
export interface ScenarioDelta {
  readonly id: string;
  readonly group: string;
  readonly currentHzPerOp: number;
  readonly previousHzPerOp: number;
  /** `current / previous - 1`; negative is slower. */
  readonly delta: number;
  /** The larger of the noise floor and either side's IQR fraction; a delta inside it is not a change. */
  readonly threshold: number;
  /** Either side sits above the throughput ceiling where a single row stops reproducing. */
  readonly unreliable: boolean;
}

/**
 * One competitor's aggregates now against then.
 */
export interface CompetitorDelta {
  readonly displayName: string;
  readonly medianDelta: number | undefined;
  readonly geomeanDelta: number | undefined;
}

/**
 * The diff, or the reason there is none.
 */
export type RunDiff =
  | {
      readonly comparable: true;
      readonly previousRunId: string;
      readonly scenarios: ReadonlyArray<ScenarioDelta>;
      readonly regressions: ReadonlyArray<ScenarioDelta>;
      readonly improvements: ReadonlyArray<ScenarioDelta>;
      readonly competitors: ReadonlyArray<CompetitorDelta>;
    }
  | { readonly comparable: false; readonly previousRunId: string; readonly reason: string };

/**
 * Formats a delta fraction as a signed percentage with one decimal.
 */
export function formatDeltaPercent(delta: number): string {
  const rounded = Number((delta * 100).toFixed(1));
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "±";
  return `${sign}${Math.abs(rounded).toFixed(1)}%`;
}

/**
 * Formats throughput compactly for a diff line: `22.3M`, `146.9K`, `830`.
 */
export function formatCompactHz(hzPerOp: number): string {
  if (hzPerOp >= 1_000_000) {
    return `${(hzPerOp / 1_000_000).toFixed(1)}M`;
  }
  if (hzPerOp >= 1000) {
    return `${(hzPerOp / 1000).toFixed(1)}K`;
  }
  return String(Math.round(hzPerOp));
}

function configKey(shape: BenchRunShape, trialCount: number): string {
  return `${shape.isolated ? "iso" : "shared"}|${shape.mode}|t${String(trialCount)}`;
}

function configLabel(shape: BenchRunShape, trialCount: number): string {
  return `${shape.isolated ? "isolated" : "shared"} · ${shape.mode} · ${String(trialCount)} trial${trialCount === 1 ? "" : "s"}`;
}

function sameEnvironment(left: Fingerprint, right: Fingerprint): boolean {
  return left.cpuModel === right.cpuModel && left.nodeVersion === right.nodeVersion && left.arch === right.arch;
}

/**
 * Reads the run `latest.json` names, for a diff; `undefined` when there is none or it is unreadable.
 *
 * @remarks Call it before the current run moves the pointer, so it still names the run before this one.
 */
export function readPreviousRun(packageRootDirectory: string): PreviousRun | undefined {
  try {
    const { runId, runDirectory } = resolveRunDirectory(packageRootDirectory);
    const { libraries, shape } = parseRunObservations(readRunObservations(runDirectory));
    if (shape === undefined || libraries.size === 0) {
      return undefined;
    }
    const trialCount = Math.max(0, ...[...libraries.values()].map((library) => library.trials.length));
    return { runId, shape, trialCount, libraries };
  } catch {
    return undefined;
  }
}

/**
 * Diffs the current run against a previous one, or explains why the two are not comparable.
 */
export function buildRunDiff(current: CurrentRun, previous: PreviousRun): RunDiff {
  const previousPivot = previous.libraries.get(current.pivot.report.fingerprint.libraryName);
  if (previousPivot === undefined) {
    return { comparable: false, previousRunId: previous.runId, reason: "the previous run has no rows for the subject" };
  }
  const currentKey = configKey(current.shape, current.trialCount);
  const previousKey = configKey(previous.shape, previous.trialCount);
  if (currentKey !== previousKey) {
    return {
      comparable: false,
      previousRunId: previous.runId,
      reason: `it ran ${configLabel(previous.shape, previous.trialCount)}, this run is ${configLabel(current.shape, current.trialCount)}`,
    };
  }
  if (!sameEnvironment(current.pivot.report.fingerprint, previousPivot.fingerprint)) {
    return {
      comparable: false,
      previousRunId: previous.runId,
      reason: "it ran on a different CPU, Node or architecture",
    };
  }

  const previousPivotReport = buildLibraryReport(previousPivot.fingerprint, previousPivot.trials, []);
  const previousById = new Map(previousPivotReport.scenarios.map((scenario) => [scenario.id, scenario]));
  const scenarios: Array<ScenarioDelta> = [];
  for (const scenario of current.pivot.report.scenarios) {
    const before = previousById.get(scenario.id);
    if (before === undefined || before.hzPerOpMedian <= 0 || scenario.hzPerOpMedian <= 0) {
      continue;
    }
    scenarios.push({
      id: scenario.id,
      group: scenario.group,
      currentHzPerOp: scenario.hzPerOpMedian,
      previousHzPerOp: before.hzPerOpMedian,
      delta: scenario.hzPerOpMedian / before.hzPerOpMedian - 1,
      threshold: Math.max(NOISY_IQR_FRACTION, scenario.hzPerOpIqrFraction, before.hzPerOpIqrFraction),
      unreliable:
        isThroughputAboveNoiseCeiling(scenario.hzPerOpMedian) || isThroughputAboveNoiseCeiling(before.hzPerOpMedian),
    });
  }
  const controlIds = new Set(
    current.pivot.report.scenarios.filter((scenario) => scenario.excludeFromAggregates).map((scenario) => scenario.id),
  );
  const decisive = scenarios.filter((entry) => !entry.unreliable && !controlIds.has(entry.id));
  const regressions = decisive
    .filter((entry) => entry.delta < -entry.threshold)
    .toSorted((left, right) => left.delta - right.delta);
  const improvements = decisive
    .filter((entry) => entry.delta > entry.threshold)
    .toSorted((left, right) => right.delta - left.delta);

  // Aggregates are compared over the rows both runs measured for the subject, so a narrowed run is
  // never read against the whole suite's median.
  const sharedIds = new Set(scenarios.map((entry) => entry.id));
  const onSharedRows = (library: ComparisonLibrary): ComparisonLibrary => ({
    ...library,
    report: { ...library.report, scenarios: library.report.scenarios.filter((row) => sharedIds.has(row.id)) },
  });
  const previousCompetitors: Array<ComparisonLibrary> = current.competitors.flatMap((competitor) => {
    const observed = previous.libraries.get(competitor.report.fingerprint.libraryName);
    return observed === undefined
      ? []
      : [onSharedRows({ ...competitor, report: buildLibraryReport(observed.fingerprint, observed.trials, []) })];
  });
  const previousPivotLibrary = onSharedRows({ ...current.pivot, report: previousPivotReport });
  const previousSummaries = new Map(
    summarizeComparison(previousPivotLibrary, previousCompetitors).map((summary) => [summary.displayName, summary]),
  );
  const competitors = summarizeComparison(onSharedRows(current.pivot), current.competitors.map(onSharedRows)).map(
    ({ displayName, headToHead }) => {
      const before = previousSummaries.get(displayName)?.headToHead;
      const ratioDelta = (now: number, then: number | undefined): number | undefined =>
        then === undefined || then <= 0 || now <= 0 ? undefined : now / then - 1;
      return {
        displayName,
        medianDelta: ratioDelta(headToHead.medianRatio, before?.medianRatio),
        geomeanDelta: ratioDelta(headToHead.geomeanRatio, before?.geomeanRatio),
      };
    },
  );
  return { comparable: true, previousRunId: previous.runId, scenarios, regressions, improvements, competitors };
}

/**
 * Reads the previous run and diffs the current one against it, for a suite's parent entry.
 *
 * @remarks Call it before the artifacts are written, while `latest.json` still names the run before this one.
 */
export function prepareRunDiff(packageRootDirectory: string, current: CurrentRun): RunDiff | undefined {
  const previous = readPreviousRun(packageRootDirectory);
  return previous === undefined ? undefined : buildRunDiff(current, previous);
}
