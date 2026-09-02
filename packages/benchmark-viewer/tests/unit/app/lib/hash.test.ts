import { describe, expect, it } from "vitest";

import { buildHash, parseHash } from "#/app/lib/hash";
import type { ViewState } from "#/app/lib/hash";
import { CHART_SKIP_TARGET_ID } from "#/app/lib/skip-chart";
import type { EmbeddedViewerPayload } from "#/types";

function minimalPayload(overrides: Partial<EmbeddedViewerPayload> = {}): EmbeddedViewerPayload {
  return {
    title: "Test",
    primaryLibraryKey: "lib-a",
    libraries: [{ key: "lib-a", displayName: "Lib A", isPrimary: true }],
    runs: [
      {
        folder: "run-1",
        envKey: "env-1",
        envLabel: "env-1",
        nodeVersion: "22",
        v8Version: "12",
        platform: "darwin",
        arch: "arm64",
        cpuModel: "cpu",
        nodeOptions: "",
        timestampIso: "2024-01-01T00:00:00.000Z",
        libraryVersions: [],
      },
    ],
    scenarios: [
      {
        id: "scenario-one",
        group: "grp",
        what: "noop",
        facets: ["tag"],
        libraries: {},
      },
    ],
    facetLabels: ["name", "tag"],
    generatedAtIso: "2024-01-01T00:00:00.000Z",
    effectiveLimit: 10,
    hasMore: false,
    ...overrides,
  };
}

const defaultView: ViewState = {
  scenarioId: "scenario-one",
  envKey: "",
  group: "",
  search: "",
  facets: [],
  runWindow: "all",
  showBands: true,
  useLogScale: false,
  showRatio: false,
};

describe("buildHash / parseHash", () => {
  it("round-trips view filters", () => {
    const payload = minimalPayload();
    const view: ViewState = {
      ...defaultView,
      envKey: "env-1",
      group: "grp",
      search: "needle",
      facets: ["name", "tag"],
      runWindow: "10",
      showBands: false,
      useLogScale: true,
      showRatio: true,
    };
    const hash = buildHash(view);
    expect(parseHash(`#${hash}`, payload)).toEqual(view);
  });

  it("drops facet labels the payload does not declare", () => {
    const payload = minimalPayload();
    expect(parseHash("#facets=tag,retired-facet", payload)).toEqual({ facets: ["tag"] });
  });

  it("ignores skip-link fragment ids that are not view keys", () => {
    const payload = minimalPayload();
    expect(parseHash(`#${CHART_SKIP_TARGET_ID}`, payload)).toEqual({});
  });
});
