import {
  BENCH_ONLY_ENV_KEY,
  BENCH_TIER_ENV_KEY,
  isRunNarrowedByEnvironment,
  resolveScenarioFilterFromEnvironment,
  resolveTierFilterFromEnvironment,
} from "#/shared/env-keys";
import type { TrialPayload } from "#/shared/protocol";

/**
 * Fails when a scenario filter left the suite's subject with nothing measured.
 *
 * @remarks A competitor implementing none of the requested ids is legitimate and reads `—` in the
 * report. The subject is not: the run then has nothing to compare, and a mistyped id is far likelier
 * than a suite that genuinely dropped its own row.
 *
 * @param subjectLibraryName - The library the suite is written to measure, named in the error.
 * @param subjectTrials - The subject's surviving trials; empty is the failure this guard names.
 *
 * @since 0.6.0
 */
export function assertSubjectMeasuredSomething(
  subjectLibraryName: string,
  subjectTrials: ReadonlyArray<TrialPayload>,
): void {
  if (!isRunNarrowedByEnvironment()) {
    return;
  }
  if (subjectTrials.some((trial) => trial.scenarios.length > 0)) {
    return;
  }
  const asked = [
    resolveScenarioFilterFromEnvironment() === undefined
      ? []
      : [`${BENCH_ONLY_ENV_KEY}="${process.env[BENCH_ONLY_ENV_KEY] ?? ""}"`],
    resolveTierFilterFromEnvironment() === undefined
      ? []
      : [`${BENCH_TIER_ENV_KEY}="${process.env[BENCH_TIER_ENV_KEY] ?? ""}"`],
  ].flat();
  throw new Error(`${asked.join(" ")} matched no scenario in ${subjectLibraryName}.`);
}
