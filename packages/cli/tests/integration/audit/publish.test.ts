import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { runPublishAudit } from "#audit/publish/run";
import { nodeFilesystem } from "#core/filesystem/node";
import type { Workspace } from "#core/workspace/workspace";
import { loadWorkspace } from "#core/workspace/workspace";

let rootDir: string;

beforeEach(() => {
  rootDir = realpathSync(mkdtempSync(path.join(tmpdir(), "codefast-audit-publish-")));
  write("pnpm-workspace.yaml", "packages:\n  - packages/*\n");
});

afterEach(() => {
  rmSync(rootDir, { recursive: true, force: true });
});

function write(relativePath: string, content: string): void {
  const filePath = path.join(rootDir, relativePath);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, content);
}

// A component library laid out like `@codefast/ui`: stylesheets in `src/css`, exported raw, and a built `dist`.
function writeLibrary(options: { readonly sources: ReadonlyArray<string>; readonly built: boolean }): void {
  write(
    "packages/ui/package.json",
    JSON.stringify({
      name: "@x/ui",
      version: "0.0.0",
      files: ["dist", "src"],
      exports: {
        "./button": {
          source: "./src/components/button.tsx",
          types: "./dist/components/button.d.ts",
          import: "./dist/components/button.js",
        },
        "./css/*": "./src/css/*",
      },
    }),
  );
  write("packages/ui/src/components/button.tsx", `export const buttonClassName = "bg-primary";\n`);
  write("packages/ui/src/css/preset.css", `@import "./foundation/source.css";\n`);
  write("packages/ui/src/css/foundation/source.css", options.sources.map((glob) => `@source "${glob}";`).join("\n"));
  if (options.built) {
    write("packages/ui/dist/components/button.js", `export const buttonClassName = "bg-primary";\n`);
    write("packages/ui/dist/components/button.js.map", "{}");
  }
}

async function unreachableStylesheets(): Promise<unknown> {
  const workspace = await workspaceAt(rootDir);
  const outcome = runPublishAudit({
    fs: nodeFilesystem,
    workspace,
    target: { path: rootDir, relativePath: ".", isFile: false },
    targetGiven: false,
    currentWorkingDirectory: rootDir,
    flags: { fix: false },
    verbose: false,
  });
  if (!outcome.ok) {
    throw outcome.error;
  }
  return outcome.value.findings.filter((finding) => finding.file.endsWith(".css"));
}

describe("audit:publish — stylesheet sources", () => {
  it("flags a preset that registers only the src the publish slim drops", async () => {
    writeLibrary({ sources: ["../../**/*.{ts,tsx}"], built: true });

    expect(await unreachableStylesheets()).toEqual([
      {
        file: "packages/ui/src/css/foundation/source.css",
        line: 1,
        text: '@source "../../**/*.{ts,tsx}"',
        message: "registers no file the tarball ships",
      },
    ]);
  });

  it("passes once the preset also registers the shipped build", async () => {
    writeLibrary({ sources: ["../../**/*.{ts,tsx}", "../../../dist/**/*.js"], built: true });

    expect(await unreachableStylesheets()).toEqual([]);
  });

  it("names the missing build when dist has not been built", async () => {
    writeLibrary({ sources: ["../../../dist/**/*.js"], built: false });

    expect(await unreachableStylesheets()).toEqual([
      expect.objectContaining({
        file: "packages/ui/src/css/foundation/source.css",
        message: "registers no file the tarball ships; dist not on disk — build the package first",
      }),
    ]);
  });

  it("skips a private package, which is never published", async () => {
    writeLibrary({ sources: ["../../**/*.{ts,tsx}"], built: true });
    write(
      "packages/ui/package.json",
      JSON.stringify({ name: "@x/ui", private: true, files: ["dist"], exports: { "./css/*": "./src/css/*" } }),
    );

    expect(await unreachableStylesheets()).toEqual([]);
  });
});

async function workspaceAt(directory: string): Promise<Workspace> {
  const workspace = await loadWorkspace(nodeFilesystem, directory);
  if (!workspace.ok) {
    throw new Error(workspace.error.message);
  }
  return workspace.value;
}
