import { afterEach, describe, expect, it, vi } from "vitest";

import type { AggregatedScenarioResult, LibraryReport } from "#/report/aggregate";
import type { ComparisonLibrary } from "#/report/comparison";
import { buildComparisonDocument, COMPARISON_DOCUMENT_SCHEMA_VERSION } from "#/report/comparison-document";
import { NOISY_IQR_FRACTION, THROUGHPUT_NOISE_CEILING_HZ_PER_OP } from "#/report/reliability";
import { BENCH_ISOLATE_ENV_KEY, BENCH_MODE_ENV_KEY, BENCH_ONLY_ENV_KEY } from "#/shared/env-keys";
import type { Fingerprint } from "#/shared/protocol";

const RUN = { runId: "2026-08-12T00-00-00-000Z" };

function fingerprint(libraryName: string, libraryVersion: string): Fingerprint {
  return {
    nodeVersion: "26.7.0",
    v8Version: "14.6.202.34-node.28",
    platform: "darwin",
    arch: "arm64",
    cpuModel: "Apple M1 Pro",
    cpuCount: 8,
    nodeOptions: "--no-warnings",
    libraryName,
    libraryVersion,
    gcExposed: false,
    timestampIso: "2026-08-12T07:00:00.000Z",
  };
}

function scenario(id: string, hzPerOpMedian: number, hzPerOpIqrFraction = 0): AggregatedScenarioResult {
  return {
    id,
    group: "micro",
    stress: false,
    excludeFromAggregates: false,
    batch: 1,
    what: `what ${id}`,
    trialsIncluded: 3,
    hzPerOpMedian,
    hzPerOpP25: hzPerOpMedian,
    hzPerOpP75: hzPerOpMedian,
    hzPerOpIqrFraction,
    meanMsMedian: 0,
    p75MsMedian: 0,
    p99MsMedian: 0,
    p999MsMedian: 0,
  };
}

function library(
  libraryName: string,
  scenarios: ReadonlyArray<AggregatedScenarioResult>,
  displayName = libraryName,
): ComparisonLibrary {
  const report: LibraryReport = {
    fingerprint: fingerprint(libraryName, "1.2.3"),
    trialCount: 3,
    sanityFailures: [],
    scenarios,
  };
  return { report, displayName };
}

describe("buildComparisonDocument", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("stamps the schema version so an older run directory is identifiable", () => {
    const document = buildComparisonDocument(library("pivot", [scenario("a", 100)]), [], RUN);
    expect(document.schemaVersion).toBe(COMPARISON_DOCUMENT_SCHEMA_VERSION);
  });

  it("carries the environment and each library at the version measured", () => {
    const document = buildComparisonDocument(
      library("pivot", [scenario("a", 100)]),
      [library("rival", [scenario("a", 50)], "Rival 1")],
      RUN,
    );
    expect(document.environment.cpuModel).toBe("Apple M1 Pro");
    expect(document.pivot.libraryName).toBe("pivot");
    expect(document.competitors).toHaveLength(1);
    expect(document.competitors[0]).toMatchObject({ displayName: "Rival 1", libraryVersion: "1.2.3" });
  });

  // The markdown table rounds to three significant figures, which cannot resolve a few percent.
  it("keeps ratios at full precision rather than the rendered rounding", () => {
    const document = buildComparisonDocument(
      library("pivot", [scenario("a", 100)]),
      [library("rival", [scenario("a", 30)])],
      RUN,
    );
    expect(document.scenarios[0]?.competitors[0]?.ratio).toBeCloseTo(100 / 30, 12);
  });

  it("names each competitor on its own cell, so a cell reads without positional context", () => {
    const document = buildComparisonDocument(
      library("pivot", [scenario("a", 100)]),
      [library("first", [scenario("a", 50)], "First"), library("second", [scenario("a", 25)], "Second")],
      RUN,
    );
    expect(document.scenarios[0]?.competitors.map((cell) => cell.displayName)).toEqual(["First", "Second"]);
  });

  it("zeroes the ratio when a competitor never measured the scenario", () => {
    const document = buildComparisonDocument(
      library("pivot", [scenario("only-pivot", 100)]),
      [library("rival", [scenario("other", 50)])],
      RUN,
    );
    expect(document.scenarios[0]?.competitors[0]).toMatchObject({ hzPerOp: 0, ratio: 0 });
  });

  // Resolved here so a reader never has to reproduce the renderer's thresholds to filter on them.
  it("resolves the reliability glyphs into booleans", () => {
    const fast = THROUGHPUT_NOISE_CEILING_HZ_PER_OP * 2;
    const document = buildComparisonDocument(
      library("pivot", [scenario("noisy", fast, NOISY_IQR_FRACTION * 2), scenario("calm", 100, 0)]),
      [library("rival", [scenario("noisy", fast / 2), scenario("calm", 50)])],
      RUN,
    );
    expect(document.scenarios[0]).toMatchObject({ isPivotIqrNoisy: true });
    expect(document.scenarios[0]?.competitors[0]?.isRatioUnreliable).toBe(true);
    expect(document.scenarios[1]).toMatchObject({ isPivotIqrNoisy: false });
    expect(document.scenarios[1]?.competitors[0]?.isRatioUnreliable).toBe(false);
  });

  it("includes the head-to-head classification per competitor", () => {
    const document = buildComparisonDocument(
      library("pivot", [scenario("a", 100), scenario("b", 10)]),
      [library("rival", [scenario("a", 50), scenario("b", 20)], "Rival")],
      RUN,
    );
    const [summary] = document.headToHead;
    expect(summary?.displayName).toBe("Rival");
    expect(summary?.headToHead.wins.map((entry) => entry.id)).toEqual(["a"]);
    expect(summary?.headToHead.losses.map((entry) => entry.id)).toEqual(["b"]);
  });

  // Strict, so a field holding undefined fails here rather than vanishing from the written file.
  it("survives a JSON round trip, which is the only way it is ever read", () => {
    const document = buildComparisonDocument(
      library("pivot", [scenario("a", 100)]),
      [library("rival", [scenario("a", 30)])],
      RUN,
    );
    expect(JSON.parse(JSON.stringify(document))).toStrictEqual(document);
  });
});

describe("buildComparisonDocument run provenance", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("carries the run id, so a latest.* mirror joins back to its directory exactly", () => {
    const document = buildComparisonDocument(library("pivot", [scenario("a", 100)]), [], RUN);
    expect(document.run.runId).toBe(RUN.runId);
  });

  it("defaults to the default profile with no filter and no isolation", () => {
    const document = buildComparisonDocument(library("pivot", [scenario("a", 100)]), [], RUN);
    expect(document.run).toMatchObject({ isolated: false, mode: "default", scenarioFilter: null });
  });

  it.each(["fast", "full"])("records the %s profile", (mode) => {
    vi.stubEnv(BENCH_MODE_ENV_KEY, mode);
    expect(buildComparisonDocument(library("pivot", [scenario("a", 100)]), [], RUN).run.mode).toBe(mode);
  });

  it("records isolation, which decides whether a row is order-independent", () => {
    vi.stubEnv(BENCH_ISOLATE_ENV_KEY, "true");
    expect(buildComparisonDocument(library("pivot", [scenario("a", 100)]), [], RUN).run.isolated).toBe(true);
  });

  it("records the run order the parent supplies", () => {
    const withOrder = buildComparisonDocument(library("pivot", [scenario("a", 100)]), [], {
      ...RUN,
      runOrder: "interleaved",
    });
    expect(withOrder.run.runOrder).toBe("interleaved");
    expect(buildComparisonDocument(library("pivot", [scenario("a", 100)]), [], RUN).run.runOrder).toBeNull();
  });

  // The whole point: a narrowed run must not read as the state of the suite.
  it("records the filter and how many of the suite's rows it measured", () => {
    vi.stubEnv(BENCH_ONLY_ENV_KEY, "a, b");
    const document = buildComparisonDocument(library("pivot", [scenario("a", 100)]), [], {
      ...RUN,
      scenariosAvailable: 24,
    });
    expect(document.run.scenarioFilter).toEqual(["a", "b"]);
    expect(document.run.scenariosMeasured).toBe(1);
    expect(document.run.scenariosAvailable).toBe(24);
  });

  it("falls back to the measured count when the suite's total is unknown", () => {
    const document = buildComparisonDocument(library("pivot", [scenario("a", 100), scenario("b", 50)]), [], RUN);
    expect(document.run.scenariosAvailable).toBe(2);
  });
});
