import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildBenchRunOutputPaths, writeBenchRunArtifacts } from "#/parent/bench-run-artifacts";
import type { ComparisonDocument } from "#/report/comparison-document";

let temporaryRoot: string;

function documentWith(run: Partial<ComparisonDocument["run"]>): ComparisonDocument {
  return {
    schemaVersion: 3,
    run: {
      runId: "2026-08-12T00-00-00-000Z",
      mode: "default",
      isolated: false,
      scenarioFilter: null,
      scenarioTier: null,
      trialCount: 3,
      scenariosMeasured: 24,
      scenariosAvailable: 24,
      runOrder: null,
      ...run,
    },
    environment: {
      nodeVersion: "26.7.0",
      v8Version: "14",
      platform: "darwin",
      arch: "arm64",
      cpuModel: "Apple M1 Pro",
      cpuCount: 8,
      nodeOptions: "",
      gcExposed: false,
      timestampIso: "2026-08-12T00:00:00.000Z",
    },
    pivot: { libraryName: "pivot", libraryVersion: "1", displayName: "pivot", trialCount: 3, sanityFailures: [] },
    competitors: [],
    scenarios: [],
    headToHead: [],
    intraLibrary: [],
  };
}

function write(comparisonDocument: ComparisonDocument): ReturnType<typeof buildBenchRunOutputPaths> {
  const paths = buildBenchRunOutputPaths(temporaryRoot);
  writeBenchRunArtifacts({ paths, comparisonDocument, librariesForJsonl: [] });
  return paths;
}

describe("writeBenchRunArtifacts", () => {
  beforeEach(() => {
    temporaryRoot = mkdtempSync(join(tmpdir(), "bench-artifacts-"));
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    rmSync(temporaryRoot, { force: true, recursive: true });
    vi.restoreAllMocks();
  });

  it("names the run directory after the run id", () => {
    const paths = write(documentWith({}));
    expect(paths.runDirectory.endsWith(paths.runId)).toBe(true);
  });

  it("writes only observations.jsonl into the run directory", () => {
    const paths = write(documentWith({}));
    expect(existsSync(paths.jsonlPath)).toBe(true);
    expect(existsSync(join(paths.runDirectory, "report.md"))).toBe(false);
    expect(existsSync(join(paths.runDirectory, "report.json"))).toBe(false);
  });

  it("points latest.json at an unfiltered run", () => {
    const paths = write(documentWith({}));
    expect(existsSync(paths.latestPointerPath)).toBe(true);
    expect(JSON.parse(readFileSync(paths.latestPointerPath, "utf8"))).toStrictEqual({ runId: paths.runId });
  });

  // latest.json has to mean the whole suite, so a narrowed run must not move it.
  it("does not move latest.json for a filtered run", () => {
    const paths = write(documentWith({ scenarioFilter: ["one-row"], scenariosMeasured: 1 }));
    expect(existsSync(paths.jsonlPath)).toBe(true);
    expect(existsSync(paths.latestPointerPath)).toBe(false);
  });

  it("leaves an existing latest.json untouched when a filtered run follows a whole one", () => {
    const wholeRun = write(documentWith({}));
    const pointerBefore = readFileSync(wholeRun.latestPointerPath, "utf8");
    write(documentWith({ scenarioFilter: ["one-row"], scenariosMeasured: 1 }));
    expect(readFileSync(wholeRun.latestPointerPath, "utf8")).toBe(pointerBefore);
  });

  it("does not move latest.json for a run narrowed to one tier", () => {
    const paths = write(documentWith({ scenarioTier: "contract", scenariosMeasured: 50 }));
    expect(existsSync(paths.jsonlPath)).toBe(true);
    expect(existsSync(paths.latestPointerPath)).toBe(false);
  });

  it("does not move latest.json when the subject measured no rows", () => {
    const paths = write(documentWith({ scenariosMeasured: 0 }));
    expect(existsSync(paths.latestPointerPath)).toBe(false);
  });
});
