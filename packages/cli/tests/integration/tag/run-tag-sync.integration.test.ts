/**
 * Integration Test: covers RunTagSyncUseCase (TagModule + DI) and TagTargetRunnerService
 * with concrete tag infrastructure adapters.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Container } from "@codefast/di";
import { NodeCliPathAdapter } from "#/shell/infrastructure/path.adapter";
import { NodeCliFsAdapter } from "#/shell/infrastructure/node-io.adapter";
import { TagVersionResolverAdapter } from "#/domains/tag/infrastructure/adapters/tag-version-resolver.adapter";
import {
  RunTagSyncUseCaseToken,
  TagTargetRunnerServiceToken,
} from "#/domains/tag/contracts/tokens";
import { TagModule } from "#/domains/tag/tag.module";

const tagFs = new NodeCliFsAdapter();
const tagCliPath = new NodeCliPathAdapter();

const container = Container.create();
container.load(TagModule);
const runTagSyncUseCase = container.resolve(RunTagSyncUseCaseToken);
const tagTargetRunner = container.resolve(TagTargetRunnerServiceToken);

function withTempPackage(
  fileName: string,
  source: string,
  fn: (args: { rootDir: string; sourceFile: string }) => void,
): void {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "tag-engine-"));
  const srcDir = path.join(rootDir, "src");
  const sourceFile = path.join(srcDir, fileName);
  try {
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(
      path.join(rootDir, "package.json"),
      '{"name":"demo","version":"1.2.3"}',
      "utf8",
    );
    fs.writeFileSync(sourceFile, source, "utf8");
    fn({ rootDir, sourceFile });
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
}

describe("resolveNearestPackageVersion", () => {
  it("loads version from nearest package.json", () => {
    withTempPackage("index.ts", "export const foo = 1;\n", ({ sourceFile }) => {
      expect(
        new TagVersionResolverAdapter(tagCliPath, tagFs).resolveNearestPackageVersion(sourceFile),
      ).toBe("1.2.3");
    });
  });
});

describe("runTagOnTarget", () => {
  it("adds @since for exported declarations and preserves existing @since tags", () => {
    const before = `/** Existing docs */
export function a() {
  return 1;
}

/** @since 0.0.1 */
export const b = 2;

const c = 3;
export { c };
`;
    withTempPackage("index.ts", before, ({ sourceFile, rootDir }) => {
      const result = tagTargetRunner.runOnTarget(path.join(rootDir, "src"), { write: true });
      const after = fs.readFileSync(sourceFile, "utf8");

      expect(result.version).toBe("1.2.3");
      expect(result.filesChanged).toBe(1);
      expect(result.taggedDeclarations).toBe(2);
      expect(after).toContain("* @since 1.2.3");
      expect(after).toContain("/** @since 0.0.1 */");
      expect(after).toContain("/**\n * @since 1.2.3\n */\nconst c = 3;");
    });
  });

  it("normalizes single-line JSDoc to multiline before appending @since", () => {
    const before = `/** String or no-substitution template literal used as a Tailwind class blob. */
export type TailwindClassBlob = string;
`;
    withTempPackage("types.ts", before, ({ sourceFile, rootDir }) => {
      tagTargetRunner.runOnTarget(path.join(rootDir, "src"), { write: true });
      const after = fs.readFileSync(sourceFile, "utf8");
      expect(after).toContain(`/**
 * String or no-substitution template literal used as a Tailwind class blob.
 *
 * @since 1.2.3
 */`);
    });
  });

  it("supports dry-run mode without changing files", () => {
    const before = "export interface User { id: string }\n";
    withTempPackage("types.ts", before, ({ sourceFile, rootDir }) => {
      const result = tagTargetRunner.runOnTarget(path.join(rootDir, "src"), { write: false });
      const after = fs.readFileSync(sourceFile, "utf8");

      expect(result.filesChanged).toBe(1);
      expect(result.taggedDeclarations).toBe(1);
      expect(after).toBe(before);
    });
  });
});

describe("runTagSync", () => {
  it("auto-discovers workspace package src directories when no target is provided", async () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "tag-workspace-"));
    const packageOneDir = path.join(rootDir, "packages", "one");
    const packageTwoDir = path.join(rootDir, "packages", "two");
    const packageOneSrcDir = path.join(packageOneDir, "src");
    const packageTwoSrcDir = path.join(packageTwoDir, "src");
    try {
      fs.mkdirSync(packageOneSrcDir, { recursive: true });
      fs.mkdirSync(packageTwoSrcDir, { recursive: true });
      fs.writeFileSync(
        path.join(rootDir, "pnpm-workspace.yaml"),
        "packages:\n  - 'packages/*'\n",
        "utf8",
      );
      fs.writeFileSync(
        path.join(packageOneDir, "package.json"),
        '{"name":"one","version":"1.0.0"}',
        "utf8",
      );
      fs.writeFileSync(
        path.join(packageTwoDir, "package.json"),
        '{"name":"two","version":"2.0.0"}',
        "utf8",
      );
      fs.writeFileSync(path.join(packageOneSrcDir, "index.ts"), "export const one = 1;\n", "utf8");
      fs.writeFileSync(path.join(packageTwoSrcDir, "index.ts"), "export const two = 2;\n", "utf8");

      const startedTargets: string[] = [];
      const completedTargets: string[] = [];
      const tagOutcome = await runTagSyncUseCase.execute({
        rootDir,
        write: true,
        listener: {
          onTargetStarted: (target) => startedTargets.push(target.rootRelativeTargetPath),
          onTargetCompleted: (target) => completedTargets.push(target.rootRelativeTargetPath),
        },
      });
      expect(tagOutcome.ok).toBe(true);
      if (!tagOutcome.ok) {
        throw new Error(tagOutcome.error.message);
      }
      const runResult = tagOutcome.value;

      expect(runResult.selectedTargets.length).toBe(2);
      expect(runResult.targetResults.every((entry) => entry.runError === null)).toBe(true);
      expect(fs.readFileSync(path.join(packageOneSrcDir, "index.ts"), "utf8")).toContain(
        "* @since 1.0.0",
      );
      expect(fs.readFileSync(path.join(packageTwoSrcDir, "index.ts"), "utf8")).toContain(
        "* @since 2.0.0",
      );
      expect(runResult.versionSummary).toBe("mixed");
      expect(runResult.distinctVersions).toEqual(["1.0.0", "2.0.0"]);
      expect(runResult.skippedPackages).toEqual([]);
      expect(runResult.filesChanged).toBe(2);
      expect(startedTargets.sort((left, right) => left.localeCompare(right))).toEqual([
        "packages/one/src",
        "packages/two/src",
      ]);
      expect(completedTargets.sort((left, right) => left.localeCompare(right))).toEqual([
        "packages/one/src",
        "packages/two/src",
      ]);
    } finally {
      fs.rmSync(rootDir, { recursive: true, force: true });
    }
  });

  it("skips workspace packages listed in skipPackages", async () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "tag-workspace-skip-"));
    const packageOneDir = path.join(rootDir, "packages", "one");
    const packageTwoDir = path.join(rootDir, "packages", "two");
    const packageOneSrcDir = path.join(packageOneDir, "src");
    const packageTwoSrcDir = path.join(packageTwoDir, "src");
    try {
      fs.mkdirSync(packageOneSrcDir, { recursive: true });
      fs.mkdirSync(packageTwoSrcDir, { recursive: true });
      fs.writeFileSync(
        path.join(rootDir, "pnpm-workspace.yaml"),
        "packages:\n  - 'packages/*'\n",
        "utf8",
      );
      fs.writeFileSync(
        path.join(packageOneDir, "package.json"),
        '{"name":"@scope/one","version":"1.0.0"}',
        "utf8",
      );
      fs.writeFileSync(
        path.join(packageTwoDir, "package.json"),
        '{"name":"@scope/two","version":"2.0.0"}',
        "utf8",
      );
      fs.writeFileSync(path.join(packageOneSrcDir, "index.ts"), "export const one = 1;\n", "utf8");
      fs.writeFileSync(path.join(packageTwoSrcDir, "index.ts"), "export const two = 2;\n", "utf8");

      const tagOutcome = await runTagSyncUseCase.execute({
        rootDir,
        write: true,
        skipPackages: ["@scope/two"],
      });
      expect(tagOutcome.ok).toBe(true);
      if (!tagOutcome.ok) {
        throw new Error(tagOutcome.error.message);
      }
      const runResult = tagOutcome.value;

      expect(runResult.skippedPackages).toEqual(["@scope/two"]);
      expect(runResult.selectedTargets).toHaveLength(1);
      expect(runResult.selectedTargets[0]?.packageName).toBe("@scope/one");
      expect(fs.readFileSync(path.join(packageOneSrcDir, "index.ts"), "utf8")).toContain(
        "* @since 1.0.0",
      );
      expect(fs.readFileSync(path.join(packageTwoSrcDir, "index.ts"), "utf8")).not.toContain(
        "* @since 2.0.0",
      );
    } finally {
      fs.rmSync(rootDir, { recursive: true, force: true });
    }
  });
});
