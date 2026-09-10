import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { JsonlBenchObservationRow } from "#/report/jsonl";
import { writeJsonlRun } from "#/report/write";
import { BENCH_ISOLATE_ENV_KEY, BENCH_MODE_ENV_KEY } from "#/shared/env-keys";
import type { Fingerprint, ScenarioTrialResult, TrialPayload } from "#/shared/protocol";

let temporaryRoot: string;

function fingerprint(): Fingerprint {
  return {
    nodeVersion: "26.1.0",
    v8Version: "14",
    platform: "darwin",
    arch: "arm64",
    cpuModel: "Apple M3 Max",
    cpuCount: 14,
    nodeOptions: "--no-warnings",
    libraryName: "@codefast/di",
    libraryVersion: "0.9.0",
    gcExposed: false,
    timestampIso: "2026-09-10T00:00:00.000Z",
  };
}

function scenario(): ScenarioTrialResult {
  return {
    id: "constant-resolve",
    group: "micro",
    stress: false,
    excludeFromAggregates: false,
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

function trials(count: number): Array<TrialPayload> {
  return Array.from({ length: count }, (_unused, trialIndex) => ({ trialIndex, scenarios: [scenario()] }));
}

function writtenRows(): Array<JsonlBenchObservationRow> {
  const outputPath = join(temporaryRoot, "observations.jsonl");
  writeJsonlRun(outputPath, [{ fingerprint: fingerprint(), trials: trials(2) }]);
  return readFileSync(outputPath, "utf8")
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as JsonlBenchObservationRow);
}

describe("writeJsonlRun config identity", () => {
  beforeEach(() => {
    temporaryRoot = mkdtempSync(join(tmpdir(), "bench-jsonl-"));
  });

  afterEach(() => {
    rmSync(temporaryRoot, { force: true, recursive: true });
    vi.unstubAllEnvs();
  });

  it("stamps the default shape when the env asks for nothing", () => {
    const [row] = writtenRows();
    expect(row).toMatchObject({ isolated: false, mode: "default", trialCount: 2 });
  });

  it("stamps the shape the env selected", () => {
    vi.stubEnv(BENCH_ISOLATE_ENV_KEY, "1");
    vi.stubEnv(BENCH_MODE_ENV_KEY, "full");
    const [row] = writtenRows();
    expect(row).toMatchObject({ isolated: true, mode: "full", trialCount: 2 });
  });

  it("stamps every row of the run with the same identity", () => {
    const rows = writtenRows();
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.trialCount === 2)).toBe(true);
  });
});
