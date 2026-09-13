import { afterEach, describe, expect, it, vi } from "vitest";

import { assertSubjectMeasuredSomething } from "#/parent/assert-subject-measured";
import { BENCH_ONLY_ENV_KEY, BENCH_TIER_ENV_KEY } from "#/shared/env-keys";
import type { ScenarioTrialResult, TrialPayload } from "#/shared/protocol";

const SUBJECT = "@codefast/tailwind-variants";

function trialWithScenarioCount(scenarioCount: number): TrialPayload {
  return {
    trialIndex: 0,
    scenarios: Array.from({ length: scenarioCount }, (_unused, index) => ({
      id: `row-${String(index)}`,
    })) as Array<ScenarioTrialResult>,
  };
}

describe("assertSubjectMeasuredSomething", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts an empty subject when no filter was requested", () => {
    expect(() => assertSubjectMeasuredSomething(SUBJECT, [trialWithScenarioCount(0)])).not.toThrow();
  });

  it("accepts a subject that measured at least one row under a filter", () => {
    vi.stubEnv(BENCH_ONLY_ENV_KEY, "row-0");
    expect(() => assertSubjectMeasuredSomething(SUBJECT, [trialWithScenarioCount(1)])).not.toThrow();
  });

  // A filter matching nothing on the subject leaves the run with nothing to compare, and a mistyped
  // id is likelier than a suite that dropped its own row.
  it("rejects a filter that matched no row on the subject", () => {
    vi.stubEnv(BENCH_ONLY_ENV_KEY, "simple-with-merg");
    expect(() => assertSubjectMeasuredSomething(SUBJECT, [trialWithScenarioCount(0)])).toThrow(
      `${BENCH_ONLY_ENV_KEY}="simple-with-merg" matched no scenario in ${SUBJECT}`,
    );
  });

  it("rejects when every trial came back empty, not only the first", () => {
    vi.stubEnv(BENCH_ONLY_ENV_KEY, "missing");
    expect(() =>
      assertSubjectMeasuredSomething(SUBJECT, [trialWithScenarioCount(0), trialWithScenarioCount(0)]),
    ).toThrow(/matched no scenario/);
  });

  it("treats a filter of only separators as no filter", () => {
    vi.stubEnv(BENCH_ONLY_ENV_KEY, " , ,");
    expect(() => assertSubjectMeasuredSomething(SUBJECT, [trialWithScenarioCount(0)])).not.toThrow();
  });

  it("rejects a tier that matched no row on the subject", () => {
    vi.stubEnv(BENCH_TIER_ENV_KEY, "engine");
    expect(() => assertSubjectMeasuredSomething(SUBJECT, [trialWithScenarioCount(0)])).toThrow(
      `${BENCH_TIER_ENV_KEY}="engine" matched no scenario in ${SUBJECT}`,
    );
  });

  it("names both filters when both narrowed the run to nothing", () => {
    vi.stubEnv(BENCH_ONLY_ENV_KEY, "alpha");
    vi.stubEnv(BENCH_TIER_ENV_KEY, "engine");
    expect(() => assertSubjectMeasuredSomething(SUBJECT, [trialWithScenarioCount(0)])).toThrow(
      `${BENCH_ONLY_ENV_KEY}="alpha" ${BENCH_TIER_ENV_KEY}="engine" matched no scenario in ${SUBJECT}`,
    );
  });
});
