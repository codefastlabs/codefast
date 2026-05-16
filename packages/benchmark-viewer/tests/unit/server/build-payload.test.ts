import { describe, expect, it } from "vitest";

import { buildEmbeddedPayload } from "#/server/payload";
import type { JsonlBenchObservationRow } from "@codefast/benchmark-harness/report/jsonl";
import type { BenchServerOptions } from "#/types";
import type { RunLines } from "#/server/payload";

function observationLine(
  libraryName: string,
  overrides: Partial<JsonlBenchObservationRow> = {},
): string {
  const row: JsonlBenchObservationRow = {
    timestampIso: "2024-01-01T00:00:00.000Z",
    libraryName,
    libraryVersion: "1.0.0",
    nodeVersion: "22.0.0",
    v8Version: "12.0.0",
    platform: "darwin",
    arch: "arm64",
    cpuModel: "Test CPU",
    cpuCount: 8,
    nodeOptions: "",
    gcExposed: false,
    trialIndex: 0,
    scenarioId: "scenario-one",
    group: "grp",
    stress: false,
    batch: 1,
    what: "noop",
    hzPerIteration: 100,
    hzPerOp: 100,
    meanMs: 10,
    p75Ms: 11,
    p99Ms: 12,
    p999Ms: 13,
    samples: 100,
    ...overrides,
  };
  return JSON.stringify(row);
}

describe("buildEmbeddedPayload", () => {
  it("uses the primary library for run environment metadata (not config order)", () => {
    const options: BenchServerOptions = {
      benchResultsDir: "/tmp",
      libraries: [
        { name: "lib-a", displayName: "Compare first in list" },
        { name: "lib-b", displayName: "Primary", isPrimary: true },
      ],
    };

    const lines: Array<string> = [
      observationLine("lib-a", { cpuModel: "From-A", hzPerOp: 50 }),
      observationLine("lib-b", { cpuModel: "From-B", hzPerOp: 80 }),
    ];

    const rawRuns: Array<RunLines> = [{ folderName: "run-1", lines }];

    const payload = buildEmbeddedPayload(rawRuns, options, false, 200);
    expect(payload.runs).toHaveLength(1);
    expect(payload.runs[0]?.cpuModel).toBe("From-B");
  });

  it("skips malformed JSONL lines instead of failing the whole payload", () => {
    const options: BenchServerOptions = {
      benchResultsDir: "/tmp",
      libraries: [{ name: "only-lib", displayName: "Only", isPrimary: true }],
    };

    const lines: Array<string> = ["not-json{{{", observationLine("only-lib")];

    const rawRuns: Array<RunLines> = [{ folderName: "run-1", lines }];

    const payload = buildEmbeddedPayload(rawRuns, options, false, 200);
    expect(payload.runs).toHaveLength(1);
    expect(payload.scenarios.length).toBeGreaterThan(0);
  });

  it("includes benchResultsWarning in the payload when provided", () => {
    const options: BenchServerOptions = {
      benchResultsDir: "/tmp",
      libraries: [{ name: "only-lib", displayName: "Only", isPrimary: true }],
    };
    const payload = buildEmbeddedPayload([], options, false, 200, "could not read dir");
    expect(payload.benchResultsWarning).toBe("could not read dir");
  });

  it("sets hasMore and effectiveLimit from arguments", () => {
    const options: BenchServerOptions = {
      benchResultsDir: "/tmp",
      libraries: [{ name: "only-lib", displayName: "Only", isPrimary: true }],
    };
    const payload = buildEmbeddedPayload([], options, true, 50);
    expect(payload.hasMore).toBe(true);
    expect(payload.effectiveLimit).toBe(50);
  });
});
