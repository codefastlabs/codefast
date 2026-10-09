import { readFileSync, readdirSync } from "node:fs";
import { basename, extname, join } from "node:path";

import * as root from "#index";

/** The hooks private to the message-scroller primitive, kept off the root and the published subpaths alike. */
const internalHooks = new Set([
  "use-message-scroller-commands",
  "use-message-scroller-controller",
  "use-message-scroller-refs",
]);

const packageExports = Object.keys(
  (
    JSON.parse(readFileSync(join(import.meta.dirname, "../../package.json"), "utf8")) as {
      exports: Record<string, unknown>;
    }
  ).exports,
);

/** Lists the module names in one `src/` family, extension stripped. */
function listModules(family: string): Array<string> {
  return readdirSync(join(import.meta.dirname, "../../src", family))
    .filter((file) => /\.tsx?$/.test(file))
    .map((file) => basename(file, extname(file)));
}

describe("root entry", () => {
  describe.each(["components", "hooks", "variants"])("re-exports every public %s module", (family) => {
    const modules = listModules(family).filter((name) => family !== "hooks" || !internalHooks.has(name));

    test.each(modules)("%s", async (name) => {
      const module: Record<string, unknown> = await import(`#${family}/${name}`);

      expect(Object.keys(root)).toEqual(expect.arrayContaining(Object.keys(module)));
    });
  });

  test.each([...internalHooks])("does not publish the internal hook %s", (name) => {
    expect(listModules("hooks")).toContain(name);
    expect(packageExports).not.toContain(`./hooks/${name}`);
  });
});
