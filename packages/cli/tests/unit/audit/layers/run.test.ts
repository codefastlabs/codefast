import path from "node:path";

import { describe, expect, it } from "vitest";

import { runLayersAudit } from "#audit/layers/run";
import { createCommandContext } from "#tests/unit/support/command-context";
import { createMemoryFilesystem } from "#tests/unit/support/memory-filesystem";

const root = path.resolve("/repo");

async function layersContext(target?: string) {
  const { fs } = createMemoryFilesystem({
    [path.join(root, "pnpm-workspace.yaml")]: "packages:\n  - packages/*\n",
    [path.join(root, "codefast.config.json")]: JSON.stringify({
      audit: { layers: { packages: { "@acme/di": { layers: [["core"], ["engine"], ["index.ts"]] } } } },
    }),
    [path.join(root, "packages/di/package.json")]: '{"name":"@acme/di"}',
    [path.join(root, "packages/di/src/core/token.ts")]: `export const token = 1;\n`,
    [path.join(root, "packages/di/src/core/binding.ts")]:
      `import { resolve } from "#engine/resolver";\nexport const b = resolve;\n`,
    [path.join(root, "packages/di/src/engine/resolver.ts")]:
      `import { token } from "#core/token";\nexport const resolve = token;\n`,
    [path.join(root, "packages/di/src/index.ts")]:
      `export { b } from "#core/binding";\nexport { resolve } from "#engine/resolver";\n`,
    [path.join(root, "packages/ui/package.json")]: '{"name":"@acme/ui"}',
  });
  return createCommandContext(fs, { cwd: root, target, flags: { fix: false } });
}

describe("runLayersAudit", () => {
  it("reports the one import that points up, at its root-relative file", async () => {
    const outcome = runLayersAudit(await layersContext());

    expect(outcome.ok && outcome.value).toMatchObject({
      scannedFiles: 4,
      scannedPackages: 1,
      findings: [
        { file: "packages/di/src/core/binding.ts", line: 1, text: `import { resolve } from "#engine/resolver";` },
      ],
    });
  });

  it("narrows to the modules under a target inside a package, and skips packages the target misses", async () => {
    const narrowed = runLayersAudit(await layersContext("packages/di/src/engine"));
    const elsewhere = runLayersAudit(await layersContext("packages/ui"));

    expect(narrowed.ok && narrowed.value).toMatchObject({ findings: [], scannedFiles: 1, scannedPackages: 1 });
    expect(elsewhere.ok && elsewhere.value).toMatchObject({ scannedFiles: 0, scannedPackages: 0 });
  });
});
