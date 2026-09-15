import { describe, expect, it } from "vitest";

import type { ExperimentPass, SideRun } from "#/parent/ab-report";
import { buildAbReportLines, extractSubjectHz, median } from "#/parent/ab-report";
import type { AbRequest } from "#/parent/ab-request";
import type { JsonlBenchObservationRow } from "#/report/jsonl";

const SUBJECT = "@codefast/di";

function observationRow(overrides: Partial<JsonlBenchObservationRow>): JsonlBenchObservationRow {
  return {
    timestampIso: "2026-01-01T00:00:00.000Z",
    libraryName: SUBJECT,
    libraryVersion: "0.0.0",
    nodeVersion: "v24.0.0",
    v8Version: "12",
    platform: "darwin",
    arch: "arm64",
    cpuModel: "test",
    cpuCount: 1,
    nodeOptions: "",
    gcExposed: false,
    trialIndex: 0,
    scenarioId: "s1",
    group: "g",
    stress: false,
    batch: 1,
    what: "what",
    hzPerIteration: 1,
    hzPerOp: 1,
    meanMs: 1,
    p75Ms: 1,
    p99Ms: 1,
    p999Ms: 1,
    samples: 1,
    isolated: true,
    mode: "full",
    trialCount: 3,
    ...overrides,
  };
}

function jsonlOf(rows: ReadonlyArray<JsonlBenchObservationRow>): string {
  return rows.map((row) => JSON.stringify(row)).join("\n");
}

function side(runId: string, hzById: Record<string, ReadonlyArray<number>>): SideRun {
  return { runId, hzById: new Map(Object.entries(hzById)) };
}

const request: AbRequest = {
  ids: new Set(["s1"]),
  baseRef: "v1",
  newRef: undefined,
  experiments: 1,
  mode: "full",
};

describe("median", () => {
  it("is undefined for no values", () => {
    expect(median([])).toBeUndefined();
  });

  it("is the middle of an odd count and the mean of the two middles of an even count", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
});

describe("extractSubjectHz", () => {
  it("collects the subject's per-trial hz/op for each requested id", () => {
    const content = jsonlOf([
      observationRow({ scenarioId: "s1", trialIndex: 0, hzPerOp: 100 }),
      observationRow({ scenarioId: "s1", trialIndex: 1, hzPerOp: 200 }),
      observationRow({ scenarioId: "other", trialIndex: 0, hzPerOp: 999 }),
      observationRow({ libraryName: "rival", scenarioId: "s1", trialIndex: 0, hzPerOp: 5 }),
    ]);
    const hz = extractSubjectHz(content, SUBJECT, new Set(["s1"]));
    expect(hz.get("s1")).toEqual([100, 200]);
  });

  it("returns an empty samples array for a requested id the subject never measured", () => {
    const content = jsonlOf([observationRow({ libraryName: "rival", scenarioId: "s1" })]);
    const hz = extractSubjectHz(content, SUBJECT, new Set(["s1"]));
    expect(hz.get("s1")).toEqual([]);
  });
});

describe("buildAbReportLines", () => {
  it("reports the ratio, median ratio, and both spreads", () => {
    const passes: ReadonlyArray<ExperimentPass> = [
      { experiment: 1, order: "base→new", baseRun: side("b1", { s1: [100] }), newRun: side("n1", { s1: [150] }) },
      { experiment: 2, order: "new→base", baseRun: side("b2", { s1: [100] }), newRun: side("n2", { s1: [150] }) },
    ];
    const text = buildAbReportLines(passes, request, SUBJECT).join("\n");
    expect(text).toContain(`A/B ${SUBJECT}`);
    expect(text).toContain("ratio 1.5000");
    expect(text).toContain("median ratio 1.5000");
    expect(text).toContain("new faster");
    expect(text).toContain("base spread");
    expect(text).toContain("new  spread");
    expect(text).toContain("base=b1");
    expect(text).toContain("new=n2");
  });

  it("flags a row missing on the base side", () => {
    const passes: ReadonlyArray<ExperimentPass> = [
      { experiment: 1, order: "base→new", baseRun: side("b1", { s1: [] }), newRun: side("n1", { s1: [150] }) },
    ];
    const text = buildAbReportLines(passes, request, SUBJECT).join("\n");
    expect(text).toContain("no rows on base (v1)");
  });

  it("flags a row missing on the new side", () => {
    const passes: ReadonlyArray<ExperimentPass> = [
      { experiment: 1, order: "base→new", baseRun: side("b1", { s1: [100] }), newRun: side("n1", { s1: [] }) },
    ];
    const text = buildAbReportLines(passes, request, SUBJECT).join("\n");
    expect(text).toContain("no rows on the new side");
  });
});
