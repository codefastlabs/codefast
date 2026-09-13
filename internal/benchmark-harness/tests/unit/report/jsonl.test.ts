import { describe, expect, it } from "vitest";

import type { JsonlBenchObservationRow } from "#/report/jsonl";
import { isJsonlBenchObservationRow, jsonlBenchObservationRowToScenarioTrialResult } from "#/report/jsonl";

/** A minimal row carrying every field the guard requires, config identity included. */
function validRow(): Record<string, unknown> {
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
    isolated: true,
    mode: "full",
    trialCount: 3,
  };
}

describe("isJsonlBenchObservationRow", () => {
  it("accepts a fully valid row", () => {
    expect(isJsonlBenchObservationRow(validRow())).toBe(true);
  });

  it.each(["isolated", "mode", "trialCount"])("rejects a row missing the required %s", (field) => {
    const row = validRow();
    delete row[field];
    expect(isJsonlBenchObservationRow(row)).toBe(false);
  });

  it.each(["quick", "", 3, null])("rejects an invalid mode %j", (mode) => {
    expect(isJsonlBenchObservationRow({ ...validRow(), mode })).toBe(false);
  });

  it("rejects a non-boolean isolated", () => {
    expect(isJsonlBenchObservationRow({ ...validRow(), isolated: "yes" })).toBe(false);
  });

  it("rejects a non-number trialCount", () => {
    expect(isJsonlBenchObservationRow({ ...validRow(), trialCount: "3" })).toBe(false);
  });

  it("rejects a row missing a required measurement field", () => {
    const row = validRow();
    delete row["samples"];
    expect(isJsonlBenchObservationRow(row)).toBe(false);
  });
});

describe("jsonlBenchObservationRowToScenarioTrialResult", () => {
  // Rows written before tiers existed were all contract rows, so the reader says so.
  it("defaults a row without a tier to contract", () => {
    const result = jsonlBenchObservationRowToScenarioTrialResult(validRow() as unknown as JsonlBenchObservationRow);
    expect(result.tier).toBe("contract");
  });

  it("keeps the tier a row carries", () => {
    const row = { ...validRow(), tier: "engine" } as unknown as JsonlBenchObservationRow;
    expect(jsonlBenchObservationRowToScenarioTrialResult(row).tier).toBe("engine");
  });
});
