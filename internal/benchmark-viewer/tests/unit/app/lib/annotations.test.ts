import { describe, expect, it } from "vitest";

import { createMarkersPlugin, definitionChangeMarkers, versionChangeMarkers } from "#/app/lib/annotations";
import type { EmbeddedRun, EmbeddedScenarioSeries } from "#/types";

function run(folder: string, version: string): EmbeddedRun {
  return {
    folder,
    envKey: "env",
    envLabel: "env",
    configKey: "cfg",
    configLabel: "cfg",
    nodeVersion: "26",
    v8Version: "14",
    platform: "darwin",
    arch: "arm64",
    cpuModel: "cpu",
    nodeOptions: "",
    timestampIso: "2026-01-01T00:00:00.000Z",
    libraryVersions: [{ key: "cf", version, gcExposed: false }],
  };
}

const scenario: EmbeddedScenarioSeries = {
  id: "simple-with-merge",
  group: "simple",
  what: "",
  facets: [],
  libraries: {},
  changes: [
    { runIndex: 2, label: "batch 1 → 12" },
    { runIndex: 5, label: "description changed" },
  ],
};

describe("definitionChangeMarkers", () => {
  it("places a change on the plotted point of its run and drops changes outside the window", () => {
    const { changes: _changes, ...unchanged } = scenario;

    expect(definitionChangeMarkers(scenario, [1, 2, 3])).toEqual([{ label: "batch 1 → 12", pointIndex: 1 }]);
    expect(definitionChangeMarkers(unchanged, [1, 2, 3])).toEqual([]);
  });
});

describe("versionChangeMarkers", () => {
  it("marks the plotted run where the library's version differs from the run before", () => {
    const runs = [run("a", "0.7.1"), run("b", "0.7.1"), run("c", "0.8.0"), run("d", "0.8.0")];
    const library = { key: "cf", displayName: "cf", isPrimary: true };

    expect(versionChangeMarkers(runs, [0, 1, 2, 3], library)).toEqual([{ label: "cf 0.7.1 → 0.8.0", pointIndex: 2 }]);
    expect(versionChangeMarkers(runs, [0, 3], library)).toEqual([{ label: "cf 0.7.1 → 0.8.0", pointIndex: 1 }]);
    expect(versionChangeMarkers(runs, [0, 1, 2, 3], undefined)).toEqual([]);
  });
});

describe("createMarkersPlugin", () => {
  it("is a Chart.js plugin with a stable id that draws after the datasets", () => {
    const plugin = createMarkersPlugin([{ label: "x", pointIndex: 0 }]);

    expect(plugin.id).toBe("definition-change-markers");
    expect(typeof plugin.afterDatasetsDraw).toBe("function");
  });
});
