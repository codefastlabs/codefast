import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AnyBenchScenario } from "#/child/bench-scenario";
import { runBenchmarkChildMain } from "#/child/run-benchmark-child-main";
import { BENCH_LIST_ENV_KEY, BENCH_ONLY_ENV_KEY } from "#/shared/env-keys";
import { extractSubprocessPayload } from "#/shared/protocol";

const BENCH_DEFAULTS = { time: 1, iterations: 1, warmupTime: 0, warmupIterations: 0 };

function trivialScenario(id: string): AnyBenchScenario {
  let counter = 0;
  return {
    id,
    group: "micro",
    what: id,
    sanity: () => true,
    build: () => () => {
      counter += 1;
    },
  };
}

// Runs the child flow in-process (no subprocess) and returns the framed payload it emits.
async function runChildAndCapture(
  parameters: Parameters<typeof runBenchmarkChildMain>[0],
): Promise<NonNullable<ReturnType<typeof extractSubprocessPayload>>> {
  let captured = "";
  const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
    captured += String(chunk);
    return true;
  });
  try {
    await runBenchmarkChildMain(parameters);
  } finally {
    writeSpy.mockRestore();
  }
  const payload = extractSubprocessPayload(captured);
  if (payload === undefined) {
    throw new Error(`child emitted no parseable payload; captured: ${captured}`);
  }
  return payload;
}

describe("runBenchmarkChildMain", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("forwards mode and trialCount into the trials it emits", async () => {
    const payload = await runChildAndCapture({
      libraryName: "@codefast/does-not-exist",
      scenarioName: "test",
      packageRoot: process.cwd(),
      collectScenarios: () => [trivialScenario("alpha")],
      benchDefaults: BENCH_DEFAULTS,
      mode: "fast",
      trialCount: 3,
    });

    expect(payload.trials).toHaveLength(3);
    expect(payload.sanityFailures).toEqual([]);
    expect(payload.trials[0]?.scenarios.map((scenario) => scenario.id)).toEqual(["alpha"]);
    // libraryName resolves to a real version only when installed; unknown otherwise.
    expect(payload.fingerprint.libraryName).toBe("@codefast/does-not-exist");
  });

  it("emits scenario ids without running trials in BENCH_LIST discovery mode", async () => {
    vi.stubEnv(BENCH_LIST_ENV_KEY, "1");
    const payload = await runChildAndCapture({
      libraryName: "lib",
      scenarioName: "test",
      packageRoot: process.cwd(),
      collectScenarios: () => [trivialScenario("alpha"), trivialScenario("beta")],
      benchDefaults: BENCH_DEFAULTS,
    });

    expect(payload.scenarioIds).toEqual(["alpha", "beta"]);
    expect(payload.trials).toEqual([]);
  });

  it("runs only the requested scenario in BENCH_ONLY worker mode", async () => {
    vi.stubEnv(BENCH_ONLY_ENV_KEY, "beta");
    const payload = await runChildAndCapture({
      libraryName: "lib",
      scenarioName: "test",
      packageRoot: process.cwd(),
      collectScenarios: () => [trivialScenario("alpha"), trivialScenario("beta")],
      benchDefaults: BENCH_DEFAULTS,
      trialCount: 2,
    });

    expect(payload.trials[0]?.scenarios.map((scenario) => scenario.id)).toEqual(["beta"]);
  });

  it("throws when BENCH_ONLY matches no collected scenario", async () => {
    vi.stubEnv(BENCH_ONLY_ENV_KEY, "missing");
    await expect(
      runBenchmarkChildMain({
        libraryName: "lib",
        scenarioName: "test",
        packageRoot: process.cwd(),
        collectScenarios: () => [trivialScenario("alpha")],
        benchDefaults: BENCH_DEFAULTS,
      }),
    ).rejects.toThrow(/matched no collected scenario/);
  });
});
