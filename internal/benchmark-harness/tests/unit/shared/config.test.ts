import { describe, expect, it } from "vitest";

import type { BenchSubprocessConfig } from "#shared/config";
import { selectLibraries } from "#shared/config";

const LIBRARIES: ReadonlyArray<BenchSubprocessConfig> = [
  { libraryName: "@codefast/di", scenarioName: "codefast", tsconfigFileName: "a.json", benchEntryFileName: "a.ts" },
  {
    libraryName: "inversify",
    displayName: "InversifyJS 8",
    scenarioName: "inversify",
    tsconfigFileName: "b.json",
    benchEntryFileName: "b.ts",
  },
  {
    libraryName: "ditox",
    displayName: "Ditox 3",
    scenarioName: "ditox",
    tsconfigFileName: "c.json",
    benchEntryFileName: "c.ts",
  },
];

describe("selectLibraries", () => {
  it("keeps every library when nothing is requested", () => {
    expect(selectLibraries(LIBRARIES, undefined)).toBe(LIBRARIES);
  });

  it("matches a libraryName or a displayName, case-insensitively, keeping configured order", () => {
    const kept = selectLibraries(LIBRARIES, new Set(["ditox 3", "@CODEFAST/di"]));

    expect(kept.map((config) => config.libraryName)).toEqual(["@codefast/di", "ditox"]);
  });

  it("names the unknown entry and every known library on a typo", () => {
    expect(() => selectLibraries(LIBRARIES, new Set(["inversfy"]))).toThrow(
      /No library is named "inversfy"\. Known: @codefast\/di/,
    );
  });
});
