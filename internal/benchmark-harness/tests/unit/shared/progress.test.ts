import { describe, expect, it } from "vitest";

import type { BenchProgressEvent } from "#/shared/progress";
import { formatProgressEvent, parseProgressEvent } from "#/shared/progress";

const EVENTS: ReadonlyArray<BenchProgressEvent> = [
  { kind: "plan", trialCount: 3, scenarioCount: 111 },
  { kind: "scenario-done", trial: 2, trialCount: 3, scenario: 41, scenarioCount: 111, scenarioId: "constant-resolve" },
  { kind: "trial-done", trial: 3, trialCount: 3 },
  { kind: "finished", wallTimeMs: 4200 },
  { kind: "child-started", scenarioName: "codefast" },
  { kind: "child-completed", scenarioName: "codefast", listMode: false },
  { kind: "child-completed", scenarioName: "injection-js", listMode: true },
];

describe("progress line protocol", () => {
  it.each(EVENTS)("round-trips %j through the child's stderr line", (event) => {
    expect(parseProgressEvent(formatProgressEvent(event))).toEqual(event);
  });

  it("keeps the scenario-done line a person can read on the child's own stderr", () => {
    expect(formatProgressEvent(EVENTS[1]!)).toBe("[bench] trial 2/3 scenario 41/111 done: constant-resolve");
  });

  it("rounds a fractional wall time to whole milliseconds", () => {
    expect(parseProgressEvent(formatProgressEvent({ kind: "finished", wallTimeMs: 4199.6 }))).toEqual({
      kind: "finished",
      wallTimeMs: 4200,
    });
  });

  it("tolerates trailing whitespace but nothing else around a line", () => {
    expect(parseProgressEvent("[bench] trial 1/1 all scenarios finished  ")).toEqual({
      kind: "trial-done",
      trial: 1,
      trialCount: 1,
    });
    expect(parseProgressEvent("[codefast] [bench] trial 1/1 all scenarios finished")).toBeUndefined();
  });

  it.each(["[bench] subprocess codefast", "[sanity] alpha: threw — boom", "", "plain text"])(
    "leaves a non-progress line (%j) to the log",
    (line) => {
      expect(parseProgressEvent(line)).toBeUndefined();
    },
  );
});
