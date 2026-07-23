import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createRunAllTrials } from "#/child/create-run-all-trials";
import { BENCH_FAST_ENV_KEY, BENCH_FULL_ENV_KEY, BENCH_TRIALS_ENV_KEY } from "#/shared/env-keys";

const BENCH_DEFAULTS = { time: 1, iterations: 1, warmupTime: 0, warmupIterations: 0 };

// An empty scenario list makes the executed trial count the observable output.
async function countExecutedTrials(parameters: Parameters<typeof createRunAllTrials>[0]): Promise<number> {
  const { runAllTrials } = createRunAllTrials(parameters);
  const trials = await runAllTrials([], []);
  return trials.length;
}

describe("createRunAllTrials mode/trialCount resolution", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("defaults to the minimum trial count without mode or env", async () => {
    await expect(countExecutedTrials({ benchDefaults: BENCH_DEFAULTS })).resolves.toBe(2);
  });

  it("uses the full-mode default when mode is passed explicitly", async () => {
    await expect(countExecutedTrials({ benchDefaults: BENCH_DEFAULTS, mode: "full" })).resolves.toBe(3);
  });

  it("falls back to the BENCH_FULL env flag when no mode is passed", async () => {
    vi.stubEnv(BENCH_FULL_ENV_KEY, "1");
    await expect(countExecutedTrials({ benchDefaults: BENCH_DEFAULTS })).resolves.toBe(3);
  });

  it("falls back to the BENCH_FAST env flag when no mode is passed", async () => {
    vi.stubEnv(BENCH_FAST_ENV_KEY, "1");
    await expect(countExecutedTrials({ benchDefaults: BENCH_DEFAULTS })).resolves.toBe(2);
  });

  it("lets an explicit mode override the env flags", async () => {
    vi.stubEnv(BENCH_FULL_ENV_KEY, "1");
    await expect(countExecutedTrials({ benchDefaults: BENCH_DEFAULTS, mode: "fast" })).resolves.toBe(2);
  });

  it("honors an explicit trialCount over BENCH_TRIALS", async () => {
    vi.stubEnv(BENCH_TRIALS_ENV_KEY, "5");
    await expect(countExecutedTrials({ benchDefaults: BENCH_DEFAULTS, trialCount: 4 })).resolves.toBe(4);
  });

  it("falls back to BENCH_TRIALS when no trialCount is passed", async () => {
    vi.stubEnv(BENCH_TRIALS_ENV_KEY, "5");
    await expect(countExecutedTrials({ benchDefaults: BENCH_DEFAULTS })).resolves.toBe(5);
  });

  it("treats an empty BENCH_TRIALS as unset and uses the default", async () => {
    vi.stubEnv(BENCH_TRIALS_ENV_KEY, "   ");
    await expect(countExecutedTrials({ benchDefaults: BENCH_DEFAULTS })).resolves.toBe(2);
  });

  it("rejects a trialCount below the minimum and uses the default", async () => {
    await expect(countExecutedTrials({ benchDefaults: BENCH_DEFAULTS, trialCount: 1 })).resolves.toBe(2);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("below minimum"));
  });

  it("lets the runAllTrials argument override every default", async () => {
    const { runAllTrials } = createRunAllTrials({ benchDefaults: BENCH_DEFAULTS, trialCount: 5 });
    await expect(runAllTrials([], [], 3)).resolves.toHaveLength(3);
  });
});
