import { describe, expect, it } from "vitest";

import { isJsonlBenchObservationRow } from "#/report/jsonl";

/** A minimal row carrying every field the guard requires, minus the optional config identity. */
function legacyRow(): Record<string, unknown> {
  return {
    timestampIso: "2026-09-10T00:00:00.000Z",
    libraryName: "@codefast/di",
    libraryVersion: "0.9.0",
    nodeVersion: "26.1.0",
    v8Version: "14",
    platform: "darwin",
    arch: "arm64",
    cpuModel: "Apple M3 Max",
    cpuCount: 14,
    nodeOptions: "--no-warnings",
    gcExposed: false,
    trialIndex: 0,
    scenarioId: "constant-resolve",
    group: "micro",
    stress: false,
    batch: 1000,
    what: "resolve a toConstantValue binding",
    hzPerIteration: 1,
    hzPerOp: 1000,
    meanMs: 0.001,
    p75Ms: 0.001,
    p99Ms: 0.002,
    p999Ms: 0.003,
    samples: 100,
  };
}

describe("isJsonlBenchObservationRow", () => {
  it("accepts a legacy row that predates the config identity", () => {
    expect(isJsonlBenchObservationRow(legacyRow())).toBe(true);
  });

  it("accepts a row carrying a valid config identity", () => {
    expect(isJsonlBenchObservationRow({ ...legacyRow(), isolated: true, mode: "full", trialCount: 3 })).toBe(true);
  });

  it.each(["quick", "", 3, null])("rejects an invalid mode %j", (mode) => {
    expect(isJsonlBenchObservationRow({ ...legacyRow(), mode })).toBe(false);
  });

  it("rejects a non-boolean isolated", () => {
    expect(isJsonlBenchObservationRow({ ...legacyRow(), isolated: "yes" })).toBe(false);
  });

  it("rejects a non-number trialCount", () => {
    expect(isJsonlBenchObservationRow({ ...legacyRow(), trialCount: "3" })).toBe(false);
  });

  it("rejects a row missing a required field", () => {
    const { samples, ...withoutSamples } = legacyRow();
    void samples;
    expect(isJsonlBenchObservationRow(withoutSamples)).toBe(false);
  });
});
