import { describe, expect, it } from "vitest";

import { ProgressTracker, progressFraction } from "#/parent/progress/progress-tracker";

function trackerAt(clock: { nowMs: number }): ProgressTracker {
  return new ProgressTracker(() => clock.nowMs);
}

describe("ProgressTracker", () => {
  it("registers rows once, in order, and ignores a repeat key", () => {
    const tracker = trackerAt({ nowMs: 0 });
    tracker.register("b", "B");
    tracker.register("a", "A");
    tracker.register("b", "B again");
    expect(tracker.snapshot().map((row) => row.label)).toEqual(["B", "A"]);
  });

  it("drops events for a key it never registered", () => {
    const tracker = trackerAt({ nowMs: 0 });
    tracker.applyEvent("ghost", { kind: "plan", trialCount: 1, scenarioCount: 1 });
    expect(tracker.snapshot()).toEqual([]);
  });

  it("walks a suite-scoped library from queued to done", () => {
    const clock = { nowMs: 100 };
    const tracker = trackerAt(clock);
    tracker.register("cf", "@codefast/di");
    expect(progressFraction(tracker.get("cf")!)).toBeUndefined();

    tracker.subprocessStarted("cf");
    expect(tracker.get("cf")).toMatchObject({ status: "running", startedAtMs: 100 });

    tracker.applyEvent("cf", { kind: "plan", trialCount: 2, scenarioCount: 4 });
    expect(progressFraction(tracker.get("cf")!)).toBe(0);

    tracker.applyEvent("cf", {
      kind: "scenario-done",
      trial: 1,
      trialCount: 2,
      scenario: 4,
      scenarioCount: 4,
      scenarioId: "d",
    });
    tracker.applyEvent("cf", { kind: "trial-done", trial: 1, trialCount: 2 });
    tracker.applyEvent("cf", {
      kind: "scenario-done",
      trial: 2,
      trialCount: 2,
      scenario: 1,
      scenarioCount: 4,
      scenarioId: "a",
    });
    // Only two units are in, so the fraction is computed on how many events arrived, not the pass ordinal.
    expect(tracker.get("cf")).toMatchObject({ passTrial: 2, passScenario: 1, unitsDone: 2, currentScenarioId: "a" });
    expect(progressFraction(tracker.get("cf")!)).toBeCloseTo(2 / 8);

    clock.nowMs = 4300;
    tracker.subprocessFinished("cf", 0);
    expect(tracker.get("cf")).toMatchObject({ status: "done", exitCode: 0, finishedAtMs: 4300 });
    expect(progressFraction(tracker.get("cf")!)).toBe(1);
  });

  it("counts a scenario-scoped library by finished subprocesses, keeping the parent's total", () => {
    const tracker = trackerAt({ nowMs: 0 });
    tracker.register("inv", "inversify", { subprocessScope: "scenario" });
    tracker.discovering("inv");
    expect(tracker.get("inv")?.status).toBe("discovering");

    tracker.setScenarioCount("inv", 3);
    expect(tracker.get("inv")).toMatchObject({ status: "idle", scenarioCount: 3 });

    tracker.subprocessStarted("inv", "alpha");
    tracker.applyEvent("inv", { kind: "plan", trialCount: 2, scenarioCount: 1 });
    expect(tracker.get("inv")).toMatchObject({ scenarioCount: 3, trialCount: 2, currentScenarioId: "alpha" });

    tracker.applyEvent("inv", {
      kind: "scenario-done",
      trial: 1,
      trialCount: 2,
      scenario: 1,
      scenarioCount: 1,
      scenarioId: "alpha",
    });
    tracker.applyEvent("inv", {
      kind: "scenario-done",
      trial: 2,
      trialCount: 2,
      scenario: 1,
      scenarioCount: 1,
      scenarioId: "alpha",
    });
    expect(tracker.get("inv")?.passScenario).toBe(0);
    tracker.subprocessFinished("inv", 0);
    expect(tracker.get("inv")).toMatchObject({ status: "idle", passScenario: 1, unitsDone: 2 });
    expect(progressFraction(tracker.get("inv")!)).toBeCloseTo(2 / 6);

    tracker.libraryDone("inv");
    expect(tracker.get("inv")?.status).toBe("done");
    expect(progressFraction(tracker.get("inv")!)).toBe(1);
  });

  it("marks a non-zero exit as failed and keeps it failed through libraryDone", () => {
    const tracker = trackerAt({ nowMs: 0 });
    tracker.register("tsy", "tsyringe", { subprocessScope: "scenario", scenarioCount: 2 });
    tracker.subprocessStarted("tsy", "alpha");
    tracker.subprocessFinished("tsy", 1);
    tracker.libraryDone("tsy");
    expect(tracker.get("tsy")).toMatchObject({ status: "failed", exitCode: 1 });
  });

  it("reads an empty plan as complete rather than dividing by zero", () => {
    const tracker = trackerAt({ nowMs: 0 });
    tracker.register("awi", "awilix");
    tracker.subprocessStarted("awi");
    tracker.applyEvent("awi", { kind: "plan", trialCount: 1, scenarioCount: 0 });
    expect(progressFraction(tracker.get("awi")!)).toBe(1);
  });
});
