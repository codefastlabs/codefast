import { describe, expect, it } from "vitest";

import { OVERLAY_DASHES, OVERLAY_PALETTE } from "#/app/lib/colors";
import { buildOverlaySeries, overlaySeriesLabel, runIndicesWithData } from "#/app/lib/overlay";
import type { EmbeddedLibraryMeta, EmbeddedScenarioSeries } from "#/types";

const libraries: Array<EmbeddedLibraryMeta> = [
  { key: "cf", displayName: "cf", isPrimary: true },
  { key: "tv", displayName: "tv", isPrimary: false },
  { key: "cva", displayName: "cva", isPrimary: false },
];

function scenario(id: string, libraries: Record<string, Array<number | null>>): EmbeddedScenarioSeries {
  const entries = Object.entries(libraries).map(([key, hz]) => [
    key,
    { hz, p25: hz, p75: hz, iqrFraction: hz.map((value) => (value === null ? null : 0.01)) },
  ]);
  return { id, group: "simple", what: "", facets: [], libraries: Object.fromEntries(entries) };
}

const withMerge = scenario("simple-with-merge", { cf: [10, 12], tv: [2, 2], cva: [1, null] });
const uncached = scenario("uncached-simple-with-merge", { cf: [0.1, 0.1] });

describe("buildOverlaySeries", () => {
  it("draws one line per row and library that has data, colour by row and dash by library", () => {
    const series = buildOverlaySeries({
      libraries,
      runIndices: [0, 1],
      scenarios: [withMerge, uncached],
      selectedScenarioId: "uncached-simple-with-merge",
    });

    expect(series.map((line) => line.label)).toEqual([
      overlaySeriesLabel("simple-with-merge", "cf"),
      overlaySeriesLabel("simple-with-merge", "tv"),
      overlaySeriesLabel("simple-with-merge", "cva"),
      overlaySeriesLabel("uncached-simple-with-merge", "cf"),
    ]);
    expect(series.slice(0, 3).map((line) => line.color)).toEqual(Array(3).fill(OVERLAY_PALETTE[0]));
    expect(series[3]?.color).toBe(OVERLAY_PALETTE[1]);
    expect(series.slice(0, 3).map((line) => line.borderDash)).toEqual(OVERLAY_DASHES.slice(0, 3));
    expect(series.map((line) => line.emphasized)).toEqual([false, false, false, true]);
    expect(series[2]?.data).toEqual([1, null]);
  });

  it("skips a library that measured nothing in the plotted runs", () => {
    const series = buildOverlaySeries({
      libraries,
      runIndices: [1],
      scenarios: [withMerge],
      selectedScenarioId: "simple-with-merge",
    });

    expect(series.map((line) => line.libraryKey)).toEqual(["cf", "tv"]);
  });
});

describe("runIndicesWithData", () => {
  it("keeps a run when any row of the overlay has a point in it", () => {
    const sparse = scenario("sparse", { cf: [null, null, 5] });

    expect(runIndicesWithData([withMerge], [0, 1, 2])).toEqual([0, 1]);
    expect(runIndicesWithData([withMerge, sparse], [0, 1, 2])).toEqual([0, 1, 2]);
    expect(runIndicesWithData([sparse], [0, 1])).toEqual([]);
  });
});
