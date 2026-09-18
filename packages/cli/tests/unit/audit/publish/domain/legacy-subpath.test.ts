import { describe, expect, it } from "vitest";

import { scanLegacySubpathImports } from "#audit/publish/domain/legacy-subpath";

describe("scanLegacySubpathImports", () => {
  it("flags a #/ specifier in each import form", () => {
    const source = [
      `import { a } from "#/core/a";`,
      `import type { B } from '#/core/b';`,
      `export { c } from "#/core/c";`,
      `const d = await import("#/core/d");`,
      `const e = require("#/core/e");`,
    ].join("\n");

    const found = scanLegacySubpathImports(source);

    expect(found.map((entry) => entry.line)).toEqual([1, 2, 3, 4, 5]);
    expect(found[0]?.raw).toBe(`"#/core/a"`);
    expect(found[3]?.raw).toBe(`"#/core/d"`);
  });

  it("ignores a bare # specifier — the correct form", () => {
    expect(scanLegacySubpathImports(`import { a } from "#core/a";\n`)).toEqual([]);
  });

  it("ignores a #/ that is not an import specifier", () => {
    // A diagnostic string and a `/^#/` regex both contain `#/` but neither is an import.
    const source = [`logger.out('use "#" not "#/"');`, `const id = hash.replace(/^#/, "");`].join("\n");

    expect(scanLegacySubpathImports(source)).toEqual([]);
  });
});
