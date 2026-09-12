import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PlainProgressDisplay } from "#/parent/progress/plain-progress-display";

describe("PlainProgressDisplay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("prints one line per milestone of a suite-scoped run and nothing per scenario", () => {
    const lines: Array<string> = [];
    const display = new PlainProgressDisplay({ write: (line) => lines.push(line), now: () => Date.now() });
    display.register("cf", "@codefast/di");
    display.subprocessStarted("cf");
    display.event("cf", { kind: "plan", trialCount: 3, scenarioCount: 2 });
    display.event("cf", {
      kind: "scenario-done",
      trial: 1,
      trialCount: 3,
      scenario: 1,
      scenarioCount: 2,
      scenarioId: "a",
    });
    display.event("cf", { kind: "trial-done", trial: 1, trialCount: 3 });
    vi.advanceTimersByTime(4200);
    display.subprocessFinished("cf", 0);
    display.finish();
    expect(lines).toEqual([
      "Running @codefast/di…",
      "@codefast/di: 2 scenario(s) × 3 trial(s)",
      "@codefast/di: trial 1/3 finished",
      "@codefast/di subprocess finished in 4.2s (exit 0).",
    ]);
  });

  it("names the scenario on a per-scenario subprocess and sums them up when the library is done", () => {
    const lines: Array<string> = [];
    const display = new PlainProgressDisplay({ write: (line) => lines.push(line), now: () => Date.now() });
    display.register("inv", "inversify", { subprocessScope: "scenario" });
    display.discovering("inv");
    display.setScenarioCount("inv", 1);
    display.subprocessStarted("inv", "alpha");
    display.event("inv", { kind: "plan", trialCount: 1, scenarioCount: 1 });
    display.subprocessFinished("inv", 0);
    display.libraryDone("inv");
    display.finish();
    expect(lines).toEqual([
      "Discovering inversify scenarios…",
      "inversify: 1 scenario(s) to measure",
      "Running inversify [alpha]…",
      "inversify subprocess finished in 0.0s (exit 0).",
      "inversify: all 1 scenario(s) measured.",
    ]);
  });

  it("reports a silent running library once per silence window", () => {
    const lines: Array<string> = [];
    const display = new PlainProgressDisplay({
      write: (line) => lines.push(line),
      now: () => Date.now(),
      heartbeatSilenceMs: 10_000,
    });
    display.register("cf", "@codefast/di");
    display.subprocessStarted("cf");
    display.event("cf", { kind: "plan", trialCount: 1, scenarioCount: 5 });
    vi.advanceTimersByTime(9_000);
    expect(lines.filter((line) => line.startsWith("Still running"))).toEqual([]);
    vi.advanceTimersByTime(2_000);
    expect(lines.filter((line) => line.startsWith("Still running"))).toEqual([
      "Still running @codefast/di (0/5)… 10.0s elapsed",
    ]);
    vi.advanceTimersByTime(5_000);
    expect(lines.filter((line) => line.startsWith("Still running"))).toHaveLength(1);
    display.finish();
  });
});
