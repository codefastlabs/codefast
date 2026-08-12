import { BENCH_ONLY_ENV_KEY, parseScenarioFilter } from "#/shared/env-keys";
import type { TrialPayload } from "#/shared/protocol";

/**
 * Fails when a scenario filter left the suite's subject with nothing measured.
 *
 * @remarks A competitor implementing none of the requested ids is legitimate and reads `—` in the
 * report. The subject is not: the run then has nothing to compare, and a mistyped id is far likelier
 * than a suite that genuinely dropped its own row.
 *
 * @param subjectLibraryName - The library the suite is written to measure, named in the error.
 */
export function assertSubjectMeasuredSomething(
  subjectLibraryName: string,
  subjectTrials: ReadonlyArray<TrialPayload>,
): void {
  if (parseScenarioFilter(process.env[BENCH_ONLY_ENV_KEY]) === undefined) {
    return;
  }
  if (subjectTrials.some((trial) => trial.scenarios.length > 0)) {
    return;
  }
  throw new Error(
    `${BENCH_ONLY_ENV_KEY}="${process.env[BENCH_ONLY_ENV_KEY] ?? ""}" matched no scenario in ${subjectLibraryName}.`,
  );
}
