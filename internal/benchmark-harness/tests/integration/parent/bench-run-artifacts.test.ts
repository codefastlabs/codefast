import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildBenchRunOutputPaths, writeBenchRunArtifacts } from "#/parent/bench-run-artifacts";
import type { ComparisonDocument } from "#/report/comparison-document";

let temporaryRoot: string;

function documentWith(run: Partial<ComparisonDocument["run"]>): ComparisonDocument {
  return {
    schemaVersion: 2,
    run: {
      runId: "2026-08-12T00-00-00-000Z",
      mode: "default",
      isolated: false,
      scenarioFilter: null,
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
  };
}

function write(comparisonDocument: ComparisonDocument): ReturnType<typeof buildBenchRunOutputPaths> {
  const paths = buildBenchRunOutputPaths(temporaryRoot);
  writeBenchRunArtifacts({ paths, markdown: "# report", comparisonDocument, librariesForJsonl: [] });
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

  it("names the run directory after the run id, so a mirror joins back exactly", () => {
    const paths = write(documentWith({}));
    expect(paths.runDirectory.endsWith(paths.runId)).toBe(true);
  });

  it("writes all three artifacts into the run directory", () => {
    const paths = write(documentWith({}));
    expect(existsSync(paths.markdownPath)).toBe(true);
    expect(existsSync(paths.jsonPath)).toBe(true);
    expect(existsSync(paths.jsonlPath)).toBe(true);
  });

  it("mirrors an unfiltered run to latest.*", () => {
    const paths = write(documentWith({}));
    expect(existsSync(paths.latestMarkdownPath)).toBe(true);
    expect(existsSync(paths.latestJsonPath)).toBe(true);
    expect(existsSync(paths.latestJsonlPath)).toBe(true);
  });

  // latest.* is what CI diffs and what a published figure is checked against.
  it("refuses to mirror a filtered run, which would look complete and not be", () => {
    const paths = write(documentWith({ scenarioFilter: ["one-row"], scenariosMeasured: 1 }));
    expect(existsSync(paths.jsonPath)).toBe(true);
    expect(existsSync(paths.latestMarkdownPath)).toBe(false);
    expect(existsSync(paths.latestJsonPath)).toBe(false);
    expect(existsSync(paths.latestJsonlPath)).toBe(false);
  });

  it("leaves an existing latest.* untouched when a filtered run follows a whole one", () => {
    const wholeRun = write(documentWith({}));
    const mirroredBefore = readFileSync(wholeRun.latestJsonPath, "utf8");
    write(documentWith({ scenarioFilter: ["one-row"], scenariosMeasured: 1 }));
    expect(readFileSync(wholeRun.latestJsonPath, "utf8")).toBe(mirroredBefore);
  });

  // A smoke profile still moves latest.*, so it has to be readable off the file.
  it("mirrors a fast run and records the profile that produced it", () => {
    const paths = write(documentWith({ mode: "fast", trialCount: 1 }));
    expect(existsSync(paths.latestJsonPath)).toBe(true);
    const mirrored = JSON.parse(readFileSync(paths.latestJsonPath, "utf8")) as ComparisonDocument;
    expect(mirrored.run.mode).toBe("fast");
    expect(mirrored.run.trialCount).toBe(1);
  });

  it("keeps no-filter as an explicit null rather than dropping the key", () => {
    const paths = write(documentWith({}));
    const written = JSON.parse(readFileSync(paths.jsonPath, "utf8")) as Record<string, unknown>;
    expect(Object.keys(written["run"] as object)).toContain("scenarioFilter");
    expect((written["run"] as ComparisonDocument["run"]).scenarioFilter).toBeNull();
  });
});
