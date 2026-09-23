import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildBenchRunOutputPaths, writeBenchRunArtifacts } from "#parent/bench-run-artifacts";
import type { ComparisonDocument } from "#report/comparison-document";
import { prepareRunDiff, readPreviousRun } from "#report/run-diff";
import type { BenchRunConfiguration } from "#shared/env-keys";
import { BENCH_BASELINE_ENV_KEY, BENCH_MODE_ENV_KEY } from "#shared/env-keys";
import { fingerprint, library, scenario, trials } from "#tests/unit/report/support/fixtures";

let temporaryRoot: string;

type Mode = BenchRunConfiguration["mode"];

// What every run below is measured under unless a test picks another profile.
const DEFAULT_CONFIGURATION: BenchRunConfiguration = { isolated: false, mode: "default", trialCount: 1 };

function wholeSuiteDocument(runId: string, mode: Mode): ComparisonDocument {
  return {
    schemaVersion: 3,
    run: {
      runId,
      mode,
      isolated: false,
      scenarioFilter: null,
      scenarioTier: null,
      libraryFilter: null,
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
function writeRun(hzPerOp: number, mode: Mode = "default"): string {
  waitForNextMillisecond();
  // The rows take their profile from the environment, the pointer from the document; both must agree.
  vi.stubEnv(BENCH_MODE_ENV_KEY, mode);
  const paths = buildBenchRunOutputPaths(temporaryRoot);
  writeBenchRunArtifacts({
    paths,
    comparisonDocument: wholeSuiteDocument(paths.runId, mode),
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

  it("reads the run its configuration's pointer names when nothing is pinned", () => {
    writeRun(100);
    const latest = writeRun(110);
    expect(readPreviousRun(temporaryRoot, DEFAULT_CONFIGURATION)).toMatchObject({
      runId: latest,
      pinned: false,
      trialCount: 1,
    });
  });

  it("reads the newest run of its own configuration, past a newer run of another", () => {
    const defaultRun = writeRun(100);
    const fullRun = writeRun(110, "full");
    expect(readPreviousRun(temporaryRoot, DEFAULT_CONFIGURATION)?.runId).toBe(defaultRun);
    expect(readPreviousRun(temporaryRoot, { ...DEFAULT_CONFIGURATION, mode: "full" })?.runId).toBe(fullRun);
  });

  it("returns nothing when only another configuration has run", () => {
    writeRun(100, "full");
    expect(readPreviousRun(temporaryRoot, DEFAULT_CONFIGURATION)).toBeUndefined();
  });

  it("reads the pinned run instead of the pointer", () => {
    const baseline = writeRun(100);
    writeRun(110);
    expect(readPreviousRun(temporaryRoot, DEFAULT_CONFIGURATION, baseline)).toMatchObject({
      runId: baseline,
      pinned: true,
    });
  });

  it("returns nothing when there is no run and nothing pinned", () => {
    expect(readPreviousRun(temporaryRoot, DEFAULT_CONFIGURATION)).toBeUndefined();
  });

  // A mistyped baseline must not silently become a diff against whatever the pointer names.
  it("throws on a pinned run that does not exist", () => {
    writeRun(100);
    expect(() => readPreviousRun(temporaryRoot, DEFAULT_CONFIGURATION, "2020-01-01T00-00-00-000Z")).toThrow(
      /No observations\.jsonl/,
    );
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

  // A full-profile pass between two default runs must not leave the second with nothing to diff against.
  it("stays comparable across a run of another profile", () => {
    const defaultRun = writeRun(100);
    writeRun(90, "full");
    expect(prepareRunDiff(temporaryRoot, current)).toMatchObject({ comparable: true, previousRunId: defaultRun });
  });
});
