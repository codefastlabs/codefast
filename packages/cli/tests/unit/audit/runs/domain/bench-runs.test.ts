import { describe, expect, it } from "vitest";

import type { BenchRunAuditModel, BenchRunSuite } from "#audit/runs/domain/bench-runs";
import { auditBenchRuns, parsePinnedBaselineId } from "#audit/runs/domain/bench-runs";

describe("parsePinnedBaselineId", () => {
  it("extracts the run id from a bench:baseline script's BENCH_BASELINE token", () => {
    const script = "BENCH_BASELINE=baselines/2026-09-14T23-41-04-932Z BENCH_MODE=full node --import tsx/esm run.ts";

    expect(parsePinnedBaselineId(script)).toBe("2026-09-14T23-41-04-932Z");
  });

  it("returns null when there is no script or no token", () => {
    expect(parsePinnedBaselineId(undefined)).toBeNull();
    expect(parsePinnedBaselineId("node --import tsx/esm run.ts")).toBeNull();
  });
});

/** A suite with one matching baseline, one cited run, both holding a single observations.jsonl. */
function cleanSuite(): BenchRunSuite {
  return {
    relativePath: "benchmarks/di",
    hasBaselinesDirectory: true,
    pinnedBaselineId: "2026-09-14T23-41-04-932Z",
    baselineEntries: [
      {
        id: "2026-09-14T23-41-04-932Z",
        relativePath: "benchmarks/di/baselines/2026-09-14T23-41-04-932Z",
        childNames: ["observations.jsonl"],
      },
    ],
    runEntries: [
      {
        id: "2026-09-20T02-07-56-518Z",
        relativePath: "benchmarks/di/runs/2026-09-20T02-07-56-518Z",
        childNames: ["observations.jsonl"],
      },
    ],
  };
}

function cleanModel(): BenchRunAuditModel {
  const suite = cleanSuite();
  return {
    suites: [suite],
    trackedObservationsPaths: [
      "benchmarks/di/baselines/2026-09-14T23-41-04-932Z/observations.jsonl",
      "benchmarks/di/runs/2026-09-20T02-07-56-518Z/observations.jsonl",
    ],
    citedPaths: new Set(["benchmarks/di/runs/2026-09-20T02-07-56-518Z"]),
  };
}

describe("auditBenchRuns", () => {
  it("reports nothing for a suite whose baselines, runs, and tracked files all line up", () => {
    expect(auditBenchRuns(cleanModel())).toEqual([]);
  });

  it("accepts a citation into a file nested inside the run directory", () => {
    const model = cleanModel();
    const nested = new Set(["benchmarks/di/runs/2026-09-20T02-07-56-518Z/observations.jsonl"]);

    expect(auditBenchRuns({ ...model, citedPaths: nested })).toEqual([]);
  });

  it("reports every baseline directory that is not the pinned run", () => {
    const suite = cleanSuite();
    const model: BenchRunAuditModel = {
      suites: [
        {
          ...suite,
          baselineEntries: [
            ...suite.baselineEntries,
            {
              id: "2026-09-20T05-28-49-997Z",
              relativePath: "benchmarks/di/baselines/2026-09-20T05-28-49-997Z",
              childNames: ["observations.jsonl"],
            },
            {
              id: "2026-09-20T14-35-20-579Z",
              relativePath: "benchmarks/di/baselines/2026-09-20T14-35-20-579Z",
              childNames: ["observations.jsonl"],
            },
          ],
        },
      ],
      trackedObservationsPaths: [
        "benchmarks/di/baselines/2026-09-14T23-41-04-932Z/observations.jsonl",
        "benchmarks/di/baselines/2026-09-20T05-28-49-997Z/observations.jsonl",
        "benchmarks/di/baselines/2026-09-20T14-35-20-579Z/observations.jsonl",
        "benchmarks/di/runs/2026-09-20T02-07-56-518Z/observations.jsonl",
      ],
      citedPaths: new Set(["benchmarks/di/runs/2026-09-20T02-07-56-518Z"]),
    };

    const findings = auditBenchRuns(model);

    expect(findings.map((finding) => finding.relativePath)).toEqual([
      "benchmarks/di/baselines/2026-09-20T05-28-49-997Z",
      "benchmarks/di/baselines/2026-09-20T14-35-20-579Z",
    ]);
    expect(findings.every((finding) => finding.reason.includes("not the pinned baseline run"))).toBe(true);
  });

  it("reports a baselines/ directory that holds a run but no bench:baseline script pins one", () => {
    const suite = cleanSuite();
    const model: BenchRunAuditModel = {
      ...cleanModel(),
      suites: [{ ...suite, pinnedBaselineId: null }],
    };

    const findings = auditBenchRuns(model);

    expect(findings).toContainEqual({
      relativePath: "benchmarks/di/baselines",
      reason: "holds a run but bench:baseline does not pin one — add the pin or delete baselines/",
    });
  });

  it("reports a pin naming a baseline directory that does not exist", () => {
    const suite = cleanSuite();
    const model: BenchRunAuditModel = {
      ...cleanModel(),
      suites: [{ ...suite, baselineEntries: [] }],
    };

    const findings = auditBenchRuns(model);

    expect(findings).toContainEqual({
      relativePath: "benchmarks/di/baselines",
      reason: "bench:baseline pins 2026-09-14T23-41-04-932Z, but baselines/2026-09-14T23-41-04-932Z/ does not exist",
    });
  });

  it("reports a runs/ directory no tracked document cites", () => {
    const model: BenchRunAuditModel = { ...cleanModel(), citedPaths: new Set() };

    const findings = auditBenchRuns(model);

    expect(findings).toContainEqual({
      relativePath: "benchmarks/di/runs/2026-09-20T02-07-56-518Z",
      reason: "not cited by a link from any tracked markdown document — cite it or delete it",
    });
  });

  it("reports a run directory that does not hold exactly one observations.jsonl file", () => {
    const suite = cleanSuite();
    const model: BenchRunAuditModel = {
      ...cleanModel(),
      suites: [
        {
          ...suite,
          runEntries: [{ ...suite.runEntries[0]!, childNames: ["observations.jsonl", "notes.txt"] }],
        },
      ],
    };

    const findings = auditBenchRuns(model);

    expect(findings).toContainEqual({
      relativePath: "benchmarks/di/runs/2026-09-20T02-07-56-518Z",
      reason: "must hold exactly one file named observations.jsonl (found: observations.jsonl, notes.txt)",
    });
  });

  it("reports a tracked observations.jsonl outside any recognized baselines/ or runs/ directory", () => {
    const model: BenchRunAuditModel = {
      ...cleanModel(),
      trackedObservationsPaths: [...cleanModel().trackedObservationsPaths, "benchmarks/di/dist/observations.jsonl"],
    };

    const findings = auditBenchRuns(model);

    expect(findings).toContainEqual({
      relativePath: "benchmarks/di/dist/observations.jsonl",
      reason: "tracked observations.jsonl outside any baselines/<run-id>/ or runs/<run-id>/ directory",
    });
  });
});
