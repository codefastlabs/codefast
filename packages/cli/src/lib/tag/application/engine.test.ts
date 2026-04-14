import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createNodeCliFs, resolveNearestPackageVersion, runTagOnTarget } from "#lib/tag";

const tagFs = createNodeCliFs();

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
      expect(resolveNearestPackageVersion(sourceFile, tagFs)).toBe("1.2.3");
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
      const result = runTagOnTarget(path.join(rootDir, "src"), { write: true }, tagFs);
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
      runTagOnTarget(path.join(rootDir, "src"), { write: true }, tagFs);
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
      const result = runTagOnTarget(path.join(rootDir, "src"), { write: false }, tagFs);
      const after = fs.readFileSync(sourceFile, "utf8");

      expect(result.filesChanged).toBe(1);
      expect(result.taggedDeclarations).toBe(1);
      expect(after).toBe(before);
    });
  });
});
