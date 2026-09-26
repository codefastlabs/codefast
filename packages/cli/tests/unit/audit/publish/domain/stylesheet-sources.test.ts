import { describe, expect, it } from "vitest";

import { missesShippedFiles, scanStylesheetSources } from "#audit/publish/domain/stylesheet-sources";

describe("scanStylesheetSources", () => {
  it("finds each registered path with its line, in either quote style", () => {
    const css = [`@import "tw-animate-css";`, ``, `@source "../../**/*.{ts,tsx}";`, `@source '../../../dist';`].join(
      "\n",
    );

    expect(scanStylesheetSources(css)).toEqual([
      { line: 3, pattern: "../../**/*.{ts,tsx}" },
      { line: 4, pattern: "../../../dist" },
    ]);
  });

  it("skips negations, inline candidates, and commented-out directives", () => {
    const css = [
      `@source not "../../**/*.test.tsx";`,
      `@source inline("underline");`,
      `/* @source "../../legacy"; */`,
      `/*`,
      ` * @source "../../also-legacy";`,
      ` */`,
      `@source "../../../dist/**/*.js";`,
    ].join("\n");

    expect(scanStylesheetSources(css)).toEqual([{ line: 7, pattern: "../../../dist/**/*.js" }]);
  });
});

describe("missesShippedFiles", () => {
  // The layout the publish slim leaves `@codefast/ui` with: `dist` and the stylesheet subtree of `src`.
  const shipped = [
    "dist/components/button.js",
    "dist/components/button.d.ts",
    "src/css/foundation/source.css",
    "src/css/preset.css",
  ];
  const stylesheet = "src/css/foundation/source.css";

  it("flags a stylesheet that registers only the workspace sources the tarball drops", () => {
    expect(missesShippedFiles(stylesheet, [{ line: 1, pattern: "../../**/*.{ts,tsx}" }], shipped)).toBe(true);
  });

  it("passes once one path reaches the shipped build", () => {
    const sources = [
      { line: 1, pattern: "../../**/*.{ts,tsx}" },
      { line: 2, pattern: "../../../dist/**/*.js" },
    ];

    expect(missesShippedFiles(stylesheet, sources, shipped)).toBe(false);
  });

  it("treats a path without a glob as a directory or a file", () => {
    expect(missesShippedFiles(stylesheet, [{ line: 1, pattern: "../../../dist" }], shipped)).toBe(false);
    expect(missesShippedFiles(stylesheet, [{ line: 1, pattern: "../../../dist/" }], shipped)).toBe(false);
    expect(missesShippedFiles(stylesheet, [{ line: 1, pattern: "../preset.css" }], shipped)).toBe(false);
    expect(missesShippedFiles(stylesheet, [{ line: 1, pattern: "../../components" }], shipped)).toBe(true);
  });

  it("does not judge a path that leaves the package", () => {
    const sources = [{ line: 1, pattern: "../../../../other-package/dist" }];

    expect(missesShippedFiles(stylesheet, sources, shipped)).toBe(false);
  });
});
