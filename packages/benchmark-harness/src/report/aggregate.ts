import type { Fingerprint, ScenarioTrialResult, TrialPayload } from "#/protocol";
import { quantile, sortAscending } from "#/stats/quantiles";

/**
 * One (library, scenario) row after collapsing the per-trial payloads.
 */
export interface AggregatedScenarioResult {
  readonly id: string;
  readonly group: string;
  readonly stress: boolean;
  readonly batch: number;
  readonly what: string;
  readonly trialsIncluded: number;
  readonly hzPerOpMedian: number;
  readonly hzPerOpIqrFraction: number;
  readonly meanMsMedian: number;
  readonly p75MsMedian: number;
  readonly p99MsMedian: number;
  readonly p999MsMedian: number;
}

export interface LibraryReport {
  readonly fingerprint: Fingerprint;
  readonly trialCount: number;
  readonly sanityFailures: readonly string[];
  readonly scenarios: readonly AggregatedScenarioResult[];
}

function aggregateTrialsForScenario(
  scenarioId: string,
  perTrialResults: readonly ScenarioTrialResult[],
): AggregatedScenarioResult | undefined {
  const successfulTrials = perTrialResults.filter((trial) => trial.samples > 0);
  if (successfulTrials.length === 0) {
    return undefined;
  }
  const firstTrial = successfulTrials[0];
  if (firstTrial === undefined) {
    return undefined;
  }
  const hzPerOpSortedAscending = sortAscending(successfulTrials.map((trial) => trial.hzPerOp));
  const meanMsSortedAscending = sortAscending(successfulTrials.map((trial) => trial.meanMs));
  const p75MsSortedAscending = sortAscending(successfulTrials.map((trial) => trial.p75Ms));
  const p99MsSortedAscending = sortAscending(successfulTrials.map((trial) => trial.p99Ms));
  const p999MsSortedAscending = sortAscending(successfulTrials.map((trial) => trial.p999Ms));

  const hzPerOpMedian = quantile(hzPerOpSortedAscending, 0.5);
  const hzPerOpP25 = quantile(hzPerOpSortedAscending, 0.25);
  const hzPerOpP75 = quantile(hzPerOpSortedAscending, 0.75);
  const hzPerOpIqrFraction = hzPerOpMedian > 0 ? (hzPerOpP75 - hzPerOpP25) / hzPerOpMedian : 0;

  return {
    id: scenarioId,
    group: firstTrial.group,
    stress: firstTrial.stress,
    batch: firstTrial.batch,
    what: firstTrial.what,
    trialsIncluded: successfulTrials.length,
    hzPerOpMedian,
    hzPerOpIqrFraction,
    meanMsMedian: quantile(meanMsSortedAscending, 0.5),
    p75MsMedian: quantile(p75MsSortedAscending, 0.5),
    p99MsMedian: quantile(p99MsSortedAscending, 0.5),
    p999MsMedian: quantile(p999MsSortedAscending, 0.5),
  };
}

export function buildLibraryReport(
  fingerprint: Fingerprint,
  trials: readonly TrialPayload[],
  sanityFailures: readonly string[],
): LibraryReport {
  const perScenarioTrials = new Map<string, ScenarioTrialResult[]>();
  for (const trial of trials) {
    for (const scenarioResult of trial.scenarios) {
      const list = perScenarioTrials.get(scenarioResult.id);
      if (list === undefined) {
        perScenarioTrials.set(scenarioResult.id, [scenarioResult]);
      } else {
        list.push(scenarioResult);
      }
    }
  }

  const aggregated: AggregatedScenarioResult[] = [];
  for (const [scenarioId, perTrialResults] of perScenarioTrials) {
    const row = aggregateTrialsForScenario(scenarioId, perTrialResults);
    if (row !== undefined) {
      aggregated.push(row);
    }
  }

  return {
    fingerprint,
    trialCount: trials.length,
    sanityFailures,
    scenarios: aggregated,
  };
}
