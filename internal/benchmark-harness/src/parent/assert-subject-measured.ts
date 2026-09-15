import {
  BENCH_LIBRARY_ENV_KEY,
  BENCH_ONLY_ENV_KEY,
  BENCH_TIER_ENV_KEY,
  isRunNarrowedByEnvironment,
  resolveLibraryFilterFromEnvironment,
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
 * @param subjectTrials - The subject's surviving trials; empty is the failure this guard names, and
 * `undefined` means a library filter left the subject out entirely.
 *
 * @since 0.6.0
 */
export function assertSubjectMeasuredSomething(
  subjectLibraryName: string,
  subjectTrials: ReadonlyArray<TrialPayload> | undefined,
): void {
  if (!isRunNarrowedByEnvironment()) {
    return;
  }
  if (subjectTrials !== undefined && subjectTrials.some((trial) => trial.scenarios.length > 0)) {
    return;
  }
  const asked = [
    resolveLibraryFilterFromEnvironment() === undefined
      ? []
      : [`${BENCH_LIBRARY_ENV_KEY}="${process.env[BENCH_LIBRARY_ENV_KEY] ?? ""}"`],
    resolveScenarioFilterFromEnvironment() === undefined
      ? []
      : [`${BENCH_ONLY_ENV_KEY}="${process.env[BENCH_ONLY_ENV_KEY] ?? ""}"`],
    resolveTierFilterFromEnvironment() === undefined
      ? []
      : [`${BENCH_TIER_ENV_KEY}="${process.env[BENCH_TIER_ENV_KEY] ?? ""}"`],
  ].flat();
  const outcome = subjectTrials === undefined ? "left" : "matched no scenario in";
  throw new Error(
    `${asked.join(" ")} ${outcome} ${subjectLibraryName}${subjectTrials === undefined ? " out; the subject must run" : ""}.`,
  );
}
