import { describe, expect, it } from "vitest";

import { OVERLAY_DASHES, OVERLAY_POINT_STYLES, PALETTE, shadeOf } from "#/app/lib/colors";
import type { PaletteEntry } from "#/app/lib/colors";
import {
  buildOverlaySeries,
  indexToFirst,
  isSparseLogTick,
  overlaySeriesLabel,
  rowShortLabel,
  runIndicesWithData,
} from "#/app/lib/overlay";
import type { EmbeddedLibraryMeta, EmbeddedScenarioSeries } from "#/types";

const libraries: Array<EmbeddedLibraryMeta> = [
  { key: "cf", displayName: "cf", isPrimary: true },
  { key: "tv", displayName: "tv", isPrimary: false },
  { key: "cva", displayName: "cva", isPrimary: false },
];

const paletteMap: Record<string, PaletteEntry> = { cf: PALETTE[0]!, tv: PALETTE[1]!, cva: PALETTE[2]! };

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
  it("draws one line per row and library that has data: a family per library, shade, dash and marker per row", () => {
    const series = buildOverlaySeries({
      hiddenScenarioIds: [],
      libraries,
      paletteMap,
      runIndices: [0, 1],
      scenarios: [withMerge, uncached],
      selectedScenarioId: "uncached-simple-with-merge",
    });

    expect(series.map((line) => line.label)).toEqual([
      overlaySeriesLabel("with-merge", "cf"),
      overlaySeriesLabel("with-merge", "tv"),
      overlaySeriesLabel("with-merge", "cva"),
      overlaySeriesLabel("uncached-with-merge", "cf"),
    ]);
    expect(series[3]?.shortLabel).toBe("uncached-with-merge");
    expect(series.map((line) => line.color)).toEqual([
      PALETTE[0]!.border,
      PALETTE[1]!.border,
      PALETTE[2]!.border,
      shadeOf(PALETTE[0]!.border, 1),
    ]);
    expect(series[3]?.color).not.toBe(PALETTE[0]!.border);
    expect(series.slice(0, 3).map((line) => line.borderDash)).toEqual(Array(3).fill(OVERLAY_DASHES[0]));
    expect(series[3]?.borderDash).toEqual(OVERLAY_DASHES[1]);
    expect(series.slice(0, 3).map((line) => line.pointStyle)).toEqual(Array(3).fill(OVERLAY_POINT_STYLES[0]));
    expect(series[3]?.pointStyle).toBe(OVERLAY_POINT_STYLES[1]);
    expect(series.map((line) => line.emphasized)).toEqual([false, false, false, true]);
    expect(series[2]?.data).toEqual([1, null]);
  });

  it("skips a library that measured nothing in the plotted runs", () => {
    const series = buildOverlaySeries({
      hiddenScenarioIds: [],
      libraries,
      paletteMap,
      runIndices: [1],
      scenarios: [withMerge],
      selectedScenarioId: "simple-with-merge",
    });

    expect(series.map((line) => line.libraryKey)).toEqual(["cf", "tv"]);
  });

  it("leaves a hidden row out while keeping the other rows' dash patterns in place", () => {
    const series = buildOverlaySeries({
      hiddenScenarioIds: ["simple-with-merge"],
      libraries,
      paletteMap,
      runIndices: [0, 1],
      scenarios: [withMerge, uncached],
      selectedScenarioId: "uncached-simple-with-merge",
    });

    expect(series.map((line) => line.scenarioId)).toEqual(["uncached-simple-with-merge"]);
    expect(series[0]?.borderDash).toEqual(OVERLAY_DASHES[1]);
    expect(series[0]?.pointStyle).toBe(OVERLAY_POINT_STYLES[1]);
  });
});

describe("shadeOf", () => {
  it("keeps the base colour for the first row and moves lightness for the others", () => {
    const base = PALETTE[0]!.border;
    const shades = [0, 1, 2, 3].map((step) => shadeOf(base, step));

    expect(shades[0]).toBe(base);
    expect(new Set(shades).size).toBe(4);
    expect(shades.every((shade) => /^#[0-9a-f]{6}$/.test(shade))).toBe(true);
  });

  it("wraps past the last step so any row count gets a shade", () => {
    expect(shadeOf(PALETTE[1]!.border, 4)).toBe(PALETTE[1]!.border);
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

describe("rowShortLabel", () => {
  it("drops the group's name from a row id, wherever it sits", () => {
    expect(rowShortLabel("simple-with-merge", "simple")).toBe("with-merge");
    expect(rowShortLabel("uncached-simple-without-merge", "simple")).toBe("uncached-without-merge");
    expect(rowShortLabel("compound-slots-with-merge", "compound-slots")).toBe("with-merge");
    expect(rowShortLabel("define-only-slots", "define-only")).toBe("slots");
  });

  it("keeps an id that is the group's name, or does not contain it", () => {
    expect(rowShortLabel("simple", "simple")).toBe("simple");
    expect(rowShortLabel("constant-resolve", "micro")).toBe("constant-resolve");
  });
});

describe("indexToFirst", () => {
  it("expresses each point as a percentage of the first positive one", () => {
    expect(indexToFirst([null, 50, 100, null, 25])).toEqual({ base: 50, values: [null, 100, 200, null, 50] });
  });

  it("answers an all-null series when nothing was plotted", () => {
    expect(indexToFirst([null, null])).toEqual({ base: null, values: [null, null] });
  });
});

describe("isSparseLogTick", () => {
  it("labels only the 1, 2 and 5 of each decade", () => {
    expect([1, 2, 5, 10, 20, 50, 100_000, 2_000_000, 5e9].every(isSparseLogTick)).toBe(true);
    expect([3, 4, 6, 7, 8, 9, 30, 400_000].some(isSparseLogTick)).toBe(false);
    expect(isSparseLogTick(0)).toBe(false);
    expect(isSparseLogTick(Number.NaN)).toBe(false);
  });
});
