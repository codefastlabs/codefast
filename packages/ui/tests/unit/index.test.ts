import { readdirSync } from "node:fs";
import { basename, extname, join } from "node:path";

import * as root from "#index";

/** Lists the module names in one `src/` family, extension stripped. */
function listModules(family: string): Array<string> {
  return readdirSync(join(import.meta.dirname, "../../src", family))
    .filter((file) => /\.tsx?$/.test(file))
    .map((file) => basename(file, extname(file)));
}

describe("root entry", () => {
  describe.each(["components", "variants"])("re-exports every %s module", (family) => {
    test.each(listModules(family))("%s", async (name) => {
      const module: Record<string, unknown> = await import(`#${family}/${name}`);

      expect(Object.keys(root)).toEqual(expect.arrayContaining(Object.keys(module)));
    });
  });
});
