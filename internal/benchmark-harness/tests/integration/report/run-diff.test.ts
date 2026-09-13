import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildBenchRunOutputPaths, writeBenchRunArtifacts } from "#/parent/bench-run-artifacts";
import type { ComparisonDocument } from "#/report/comparison-document";
import { prepareRunDiff, readPreviousRun } from "#/report/run-diff";
import { BENCH_BASELINE_ENV_KEY } from "#/shared/env-keys";
import { fingerprint, library, scenario, trials } from "#/tests/unit/report/support/fixtures";

let temporaryRoot: string;

function wholeSuiteDocument(runId: string): ComparisonDocument {
  return {
    schemaVersion: 3,
    run: {
      runId,
      mode: "default",
      isolated: false,
      scenarioFilter: null,
      scenarioTier: null,
      trialCount: 1,
      scenariosMeasured: 1,
      scenariosAvailable: 1,
      runOrder: null,
    },
    environment: {
      nodeVersion: "26.1.0",
      v8Version: "14.6",
      platform: "darwin",
      arch: "arm64",
      cpuModel: "Apple M3 Max",
      cpuCount: 14,
      nodeOptions: "--no-warnings",
      gcExposed: false,
      timestampIso: "2026-09-12T00:00:00.000Z",
    },
    pivot: { libraryName: "cf", libraryVersion: "1.0.0", displayName: "cf", trialCount: 1, sanityFailures: [] },
    competitors: [],
    scenarios: [],
    headToHead: [],
    intraLibrary: [],
  };
}

// Run ids are millisecond timestamps, so two writes in one tick would share a directory.
function waitForNextMillisecond(): void {
  const start = Date.now();
  while (Date.now() === start) {
    // spin: a one-millisecond gap is all that separates two run ids
  }
}

// Writes one whole-suite run holding a single subject row at the given throughput, and returns its id.
function writeRun(hzPerOp: number): string {
  waitForNextMillisecond();
  const paths = buildBenchRunOutputPaths(temporaryRoot);
  writeBenchRunArtifacts({
    paths,
    comparisonDocument: wholeSuiteDocument(paths.runId),
    librariesForJsonl: [{ fingerprint: fingerprint("cf"), trials: trials([scenario("steady", hzPerOp)]) }],
  });
  return paths.runId;
}

describe("readPreviousRun", () => {
  beforeEach(() => {
    temporaryRoot = mkdtempSync(join(tmpdir(), "bench-run-diff-"));
  });

  afterEach(() => {
    rmSync(temporaryRoot, { force: true, recursive: true });
    vi.unstubAllEnvs();
  });

  it("reads the run latest.json names when nothing is pinned", () => {
    writeRun(100);
    const latest = writeRun(110);
    expect(readPreviousRun(temporaryRoot)).toMatchObject({ runId: latest, pinned: false, trialCount: 1 });
  });

  it("reads the pinned run instead of the pointer", () => {
    const baseline = writeRun(100);
    writeRun(110);
    expect(readPreviousRun(temporaryRoot, baseline)).toMatchObject({ runId: baseline, pinned: true });
  });

  it("returns nothing when there is no run and nothing pinned", () => {
    expect(readPreviousRun(temporaryRoot)).toBeUndefined();
  });

  // A mistyped baseline must not silently become a diff against whatever the pointer names.
  it("throws on a pinned run that does not exist", () => {
    writeRun(100);
    expect(() => readPreviousRun(temporaryRoot, "2020-01-01T00-00-00-000Z")).toThrow(/No observations\.jsonl/);
  });
});

describe("prepareRunDiff", () => {
  beforeEach(() => {
    temporaryRoot = mkdtempSync(join(tmpdir(), "bench-run-diff-"));
  });

  afterEach(() => {
    rmSync(temporaryRoot, { force: true, recursive: true });
    vi.unstubAllEnvs();
  });

  const current = {
    pivot: library("cf", [scenario("steady", 120)]),
    competitors: [],
    shape: { isolated: false, mode: "default" as const },
    trialCount: 1,
  };

  it("diffs against the pinned baseline named by BENCH_BASELINE, however many runs followed it", () => {
    const baseline = writeRun(100);
    writeRun(110);
    writeRun(115);
    vi.stubEnv(BENCH_BASELINE_ENV_KEY, baseline);
    const diff = prepareRunDiff(temporaryRoot, current);
    expect(diff).toMatchObject({ comparable: true, previousRunId: baseline, pinned: true });
    if (diff?.comparable !== true) {
      throw new Error("expected a comparable diff");
    }
    expect(diff.scenarios[0]?.delta).toBeCloseTo(0.2);
  });

  it("diffs against the pointer when nothing is pinned", () => {
    writeRun(100);
    const latest = writeRun(110);
    expect(prepareRunDiff(temporaryRoot, current)).toMatchObject({ previousRunId: latest, pinned: false });
  });
});
