import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";

import type { ProgressDisplay } from "#/parent/progress/progress-display";
import type { RunBenchSubprocessParameters, SubprocessLauncher } from "#/parent/run-bench-subprocess";
import {
  buildSubprocessEnvironment,
  discoverBenchScenarioIds,
  runBenchSubprocess,
  runBenchSubprocessesInterleaved,
  SubprocessExecutionError,
} from "#/parent/run-bench-subprocess";
import { BENCH_LIST_ENV_KEY, BENCH_MODE_ENV_KEY, BENCH_ONLY_ENV_KEY } from "#/shared/env-keys";

const FAKE_SUITE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "fake-suite");

// The fixture is plain JavaScript, so the child is node itself: no tsx, no pnpm, nothing to install.
const launchWithNode: SubprocessLauncher = ({ entryPath }) => ({ command: process.execPath, args: [entryPath] });

/** Records every call so a test can assert the exact sequence the parent reported. */
class RecordingDisplay implements ProgressDisplay {
  readonly calls: Array<string> = [];
  readonly logs: Array<string> = [];

  register(key: string, label: string): void {
    this.calls.push(`register ${key} ${label}`);
  }
  discovering(key: string): void {
    this.calls.push(`discovering ${key}`);
  }
  setScenarioCount(key: string, scenarioCount: number): void {
    this.calls.push(`setScenarioCount ${key} ${String(scenarioCount)}`);
  }
  subprocessStarted(key: string, scenarioId?: string): void {
    this.calls.push(`started ${key}${scenarioId === undefined ? "" : ` ${scenarioId}`}`);
  }
  event(key: string, event: { kind: string }): void {
    this.calls.push(`event ${key} ${event.kind}`);
  }
  subprocessFinished(key: string, exitCode: number | undefined): void {
    this.calls.push(`finished ${key} ${String(exitCode)}`);
  }
  libraryDone(key: string): void {
    this.calls.push(`libraryDone ${key}`);
  }
  libraryFailed(key: string): void {
    this.calls.push(`libraryFailed ${key}`);
  }
  log(line: string): void {
    this.logs.push(line);
  }
  finish(): void {
    this.calls.push("finish");
  }
}

function parametersFor(
  display: RecordingDisplay | undefined,
  overrides: Partial<RunBenchSubprocessParameters> = {},
): RunBenchSubprocessParameters {
  return {
    packageRootDirectory: FAKE_SUITE_ROOT,
    tsconfigFileName: "tsconfig.json",
    benchEntryFileNameUnderSrc: "fake-benches.mjs",
    harnessLabel: "Fake",
    scenarioName: "fake",
    forwardChildStdoutVerbose: false,
    launch: launchWithNode,
    ...(display === undefined ? {} : { progress: { display, key: "fake-lib" } }),
    ...overrides,
  };
}

describe("runBenchSubprocess", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns the framed payload and feeds the display every progress event, keeping other lines as logs", async () => {
    const display = new RecordingDisplay();
    const payload = await runBenchSubprocess(parametersFor(display, { environmentOverrides: { FAKE_TRIALS: "2" } }));

    expect(payload.trials).toHaveLength(2);
    expect(payload.trials[0]?.scenarios.map((scenario) => scenario.id)).toEqual(["alpha", "beta"]);
    expect(payload.scenarioIds).toEqual(["alpha", "beta"]);
    expect(display.calls).toEqual([
      "started fake-lib",
      "event fake-lib child-started",
      "event fake-lib plan",
      "event fake-lib scenario-done",
      "event fake-lib scenario-done",
      "event fake-lib trial-done",
      "event fake-lib scenario-done",
      "event fake-lib scenario-done",
      "event fake-lib trial-done",
      "event fake-lib finished",
      "event fake-lib child-completed",
      "finished fake-lib 0",
    ]);
    // Progress lines are consumed; the stray sanity line stays visible; stdout stays quiet.
    expect(display.logs).toEqual(["[fake] [sanity] a stray line the parent must keep"]);
  });

  it("streams every child line, stdout included, when verbose", async () => {
    const display = new RecordingDisplay();
    await runBenchSubprocess(parametersFor(display, { forwardChildStdoutVerbose: true }));

    expect(display.logs).toContain("[fake] stdout chatter from the fake child");
    expect(display.logs).toContain("[fake] [bench] plan trials=1 scenarios=2");
    expect(display.logs).toContain("[fake] [sanity] a stray line the parent must keep");
  });

  it("reports a non-zero exit on the display, dumps the child's output, and throws with the exit code", async () => {
    const display = new RecordingDisplay();
    const failure: unknown = await runBenchSubprocess(
      parametersFor(display, { environmentOverrides: { FAKE_MODE: "fail" } }),
    ).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(SubprocessExecutionError);
    expect((failure as SubprocessExecutionError).exitCode).toBe(1);
    expect(display.calls).toContain("finished fake-lib 1");
    expect(display.logs).toContain("--- subprocess stderr ---");
    expect(display.logs.some((line) => line.includes("boom: the fake child failed on purpose"))).toBe(true);
  });

  it("throws when the child prints no framing markers", async () => {
    await expect(
      runBenchSubprocess(parametersFor(new RecordingDisplay(), { environmentOverrides: { FAKE_MODE: "no-markers" } })),
    ).rejects.toThrow(/did not contain/);
  });

  it("throws when the frame holds invalid JSON", async () => {
    await expect(
      runBenchSubprocess(parametersFor(new RecordingDisplay(), { environmentOverrides: { FAKE_MODE: "bad-json" } })),
    ).rejects.toThrow(/failed to parse/);
  });

  it("logs plain milestones on stderr when no display is given", async () => {
    const written: Array<string> = [];
    vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
      written.push(String(chunk));
      return true;
    });
    await runBenchSubprocess(parametersFor(undefined));
    const output = written.join("");
    expect(output).toContain("Running Fake…");
    expect(output).toMatch(/Fake subprocess finished in \d+\.\ds \(exit 0\)\./);
    expect(output).toContain("[fake] [sanity] a stray line the parent must keep");
    expect(output).not.toContain("[bench] plan");
  });
});

describe("discoverBenchScenarioIds", () => {
  it("runs the child in list mode and marks the row discovering without finishing it", async () => {
    const display = new RecordingDisplay();
    const { scenarioIds } = await discoverBenchScenarioIds(
      parametersFor(display, { environmentOverrides: { FAKE_SCENARIOS: "one,two,three" } }),
    );
    expect(scenarioIds).toEqual(["one", "two", "three"]);
    expect(display.calls).toEqual([
      "discovering fake-lib",
      "event fake-lib child-started",
      "event fake-lib child-completed",
    ]);
  });

  it("rejects a library that lists no scenarios", async () => {
    await expect(
      discoverBenchScenarioIds(parametersFor(new RecordingDisplay(), { environmentOverrides: { FAKE_SCENARIOS: "" } })),
    ).rejects.toThrow(/no scenario ids/);
  });
});

describe("runBenchSubprocessesInterleaved", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("discovers every library, runs each scenario per implementing library, and merges the trials", async () => {
    const display = new RecordingDisplay();
    const payloads = await runBenchSubprocessesInterleaved(
      [
        {
          key: "left",
          parameters: parametersFor(undefined, {
            harnessLabel: "Left",
            environmentOverrides: { FAKE_LIBRARY: "left", FAKE_SCENARIOS: "alpha,beta", FAKE_TRIALS: "2" },
          }),
        },
        {
          key: "right",
          parameters: parametersFor(undefined, {
            harnessLabel: "Right",
            environmentOverrides: { FAKE_LIBRARY: "right", FAKE_SCENARIOS: "beta", FAKE_TRIALS: "2" },
          }),
        },
      ],
      display,
    );

    const left = payloads.get("left");
    const right = payloads.get("right");
    expect(left?.scenarioIds).toEqual(["alpha", "beta"]);
    expect(left?.trials).toHaveLength(2);
    expect(left?.trials[0]?.scenarios.map((scenario) => scenario.id)).toEqual(["alpha", "beta"]);
    expect(right?.trials[1]?.scenarios.map((scenario) => scenario.id)).toEqual(["beta"]);

    expect(display.calls.slice(0, 2)).toEqual(["register left Left", "register right Right"]);
    expect(display.calls).toContain("setScenarioCount left 2");
    expect(display.calls).toContain("setScenarioCount right 1");
    expect(display.calls.filter((call) => call.startsWith("started left"))).toEqual([
      "started left alpha",
      "started left beta",
    ]);
    expect(display.calls.filter((call) => call.startsWith("started right"))).toEqual(["started right beta"]);
    expect(display.calls.slice(-2)).toEqual(["libraryDone left", "libraryDone right"]);
    expect(display.logs.some((line) => line.includes("2 scenarios × 2 libraries"))).toBe(true);
  });

  it("honours BENCH_ONLY from the parent environment before scheduling", async () => {
    vi.stubEnv(BENCH_ONLY_ENV_KEY, "beta");
    const display = new RecordingDisplay();
    const payloads = await runBenchSubprocessesInterleaved(
      [
        {
          key: "left",
          parameters: parametersFor(undefined, { environmentOverrides: { FAKE_SCENARIOS: "alpha,beta" } }),
        },
      ],
      display,
    );
    expect(payloads.get("left")?.trials[0]?.scenarios.map((scenario) => scenario.id)).toEqual(["beta"]);
    expect(display.calls).toContain("setScenarioCount left 1");
    expect(display.calls.filter((call) => call.startsWith("started left"))).toEqual(["started left beta"]);
  });
});

describe("buildSubprocessEnvironment", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("pins production, appends --no-warnings, and strips the internal protocol keys", () => {
    vi.stubEnv(BENCH_LIST_ENV_KEY, "true");
    vi.stubEnv("NODE_OPTIONS", "--max-old-space-size=512");
    const environment = buildSubprocessEnvironment();
    expect(environment["NODE_ENV"]).toBe("production");
    expect(environment["NODE_OPTIONS"]).toBe("--max-old-space-size=512 --no-warnings");
    expect(environment[BENCH_LIST_ENV_KEY]).toBeUndefined();
  });

  it("exposes gc in the full profile and warns about a debugger flag", () => {
    vi.stubEnv(BENCH_MODE_ENV_KEY, "full");
    vi.stubEnv("NODE_OPTIONS", "--inspect");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(buildSubprocessEnvironment()["NODE_OPTIONS"]).toBe("--inspect --expose-gc --no-warnings");
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("debugger flags"));
  });
});
