import { describe, expect, it } from "vitest";

import { auditLayeringSource, invalidLayerEntry, LayerMap, layerKeyOf } from "#audit/layers/domain/layering";

const layers = new LayerMap([["core", "errors.ts"], ["engine"], ["index.ts"]]);

function audit(modulePath: string, source: string) {
  return auditLayeringSource(`/repo/src/${modulePath}`, modulePath, source, layers);
}

describe("layerKeyOf", () => {
  it("keys a module by its first segment, without a module extension", () => {
    expect(layerKeyOf("errors.ts")).toBe("errors");
    expect(layerKeyOf("core/binding.ts")).toBe("core");
    expect(layerKeyOf("engine/plan/compiler.tsx")).toBe("engine");
    expect(layerKeyOf("index.ts")).toBe("index");
  });
});

describe("invalidLayerEntry", () => {
  it("accepts families directly under the root, spelled as a directory or a file", () => {
    expect(invalidLayerEntry([["core", "errors.ts", "lifecycle/"], ["engine"]])).toBeUndefined();
  });

  it("refuses an entry nested below the root", () => {
    expect(invalidLayerEntry([["core"], ["engine/plan"]])).toContain('"engine/plan"');
  });

  it("refuses a family placed twice, however spelled", () => {
    expect(invalidLayerEntry([["errors.ts"], ["errors"]])).toContain('already placed by "errors.ts"');
  });
});

describe("auditLayeringSource", () => {
  it("accepts imports that point down or sideways", () => {
    const source = [
      `import { token } from "#core/token";`,
      `import { DiError } from "#errors";`,
      `import { pool } from "#engine/pool";`,
      `import { z } from "zod";`,
      ``,
    ].join("\n");
    expect(audit("engine/resolver.ts", source)).toEqual([]);
  });

  it("flags a value import that points up, naming both layers", () => {
    const violations = audit("core/binding.ts", `import { resolve } from "#engine/resolver";\n`);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({ line: 1, raw: `import { resolve } from "#engine/resolver";` });
    expect(violations[0]?.reason).toContain("core (layer 1) reaches engine (layer 2)");
  });

  it("lets a type-only import point up, whether the whole declaration or every specifier is type-only", () => {
    const source = [
      `import type { Resolver } from "#engine/resolver";`,
      `import { type Plan, type Node } from "#engine/plan";`,
      `export type { Frame } from "#engine/frame";`,
      ``,
    ].join("\n");
    expect(audit("core/binding.ts", source)).toEqual([]);
  });

  it("flags a mixed import whose value half points up", () => {
    const violations = audit("core/binding.ts", `import { type Plan, compile } from "#engine/plan";\n`);
    expect(violations).toHaveLength(1);
  });

  it("flags value re-exports, side-effect imports and dynamic imports that point up", () => {
    const source = [
      `export { compile } from "#engine/plan";`,
      `export * from "#engine/codegen";`,
      `import "#engine/side-effect";`,
      `export async function load() {`,
      `  return import("#engine/lazy");`,
      `}`,
      ``,
    ].join("\n");
    const violations = audit("core/binding.ts", source);
    expect(violations.map((violation) => violation.line)).toEqual([1, 2, 3, 5]);
  });

  it("resolves a relative import against the module, and skips one that climbs out of the root", () => {
    const up = audit("core/binding.ts", `import { resolve } from "../engine/resolver";\n`);
    expect(up).toHaveLength(1);
    expect(audit("core/binding.ts", `import { tag } from "./tag";\n`)).toEqual([]);
    expect(audit("core/binding.ts", `import { other } from "../../other/module";\n`)).toEqual([]);
  });

  it("reports a module that no layer places, without reading its imports", () => {
    const violations = audit("plugins/hook.ts", `import { resolve } from "#engine/resolver";\n`);
    expect(violations).toEqual([
      { line: 1, raw: "plugins/hook.ts", reason: expect.stringContaining('place "plugins" in one') },
    ]);
  });

  it("reports an import whose target sits in no layer", () => {
    const violations = audit("engine/resolver.ts", `import { fixture } from "#tests/unit/support/fixture";\n`);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.reason).toContain("sits in no configured layer");
  });
});
