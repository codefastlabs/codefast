import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import type { ConstituentKind } from "#audit/props/domain/props-intersection";
import { runPropsAudit } from "#audit/props/run";
import type { PropsTypeProbe } from "#audit/props/type-probe";
import { createAuditTestFilesystem } from "#tests/unit/support/audit-test-filesystem";

/** A probe that resolves every part by its text, standing in for the type server. */
function fakeProbe(kindsByText: Record<string, ConstituentKind>, dispose: () => void = () => {}): PropsTypeProbe {
  return {
    forFile: () => (parts) => parts.map(({ text }) => kindsByText[text] ?? "object"),
    dispose,
  };
}

describe("runPropsAudit", () => {
  const rootDir = path.join(path.sep, "repo");
  const sourcePath = path.join(rootDir, "packages", "a", "src", "a.tsx");
  const plainPath = path.join(rootDir, "packages", "a", "src", "plain.ts");

  it("reports what the probe resolves to object parts, and keeps a union", async () => {
    const fs = createAuditTestFilesystem({
      [sourcePath]: ["type BoxProps = Base & { b: string };", "type PickProps = Choice & { c: string };"].join("\n"),
      [plainPath]: "export const plain = 1;\n",
    });
    const dispose = vi.fn();

    const result = await runPropsAudit(fs, { rootDir, targetPath: rootDir, allowlist: [] }, async () =>
      fakeProbe({ Choice: "union" }, dispose),
    );

    expect(result.ok && result.value).toMatchObject({
      violationCount: 1,
      scannedFileCount: 2,
      files: [{ relativePath: "packages/a/src/a.tsx", violations: [{ line: 1 }] }],
    });
    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it("never starts the type server for a tree without a candidate", async () => {
    const fs = createAuditTestFilesystem({ [plainPath]: 'type PlainProps = ComponentProps<"div">;\n' });
    const createProbe = vi.fn(async () => fakeProbe({}));

    const result = await runPropsAudit(fs, { rootDir, targetPath: rootDir, allowlist: [] }, createProbe);

    expect(result.ok && result.value).toMatchObject({ violationCount: 0, scannedFileCount: 1 });
    expect(createProbe).not.toHaveBeenCalled();
  });

  it("drops a finding the config allowlists by its repo-relative path", async () => {
    const fs = createAuditTestFilesystem({ [sourcePath]: "type BoxProps = Base & { b: string };\n" });

    const result = await runPropsAudit(
      fs,
      { rootDir, targetPath: rootDir, allowlist: ["packages/a/src/a.tsx:type BoxProps = Base & { b: string };"] },
      async () => fakeProbe({}),
    );

    expect(result.ok && result.value).toMatchObject({ violationCount: 0, allowlistedCount: 1, files: [] });
  });

  it("returns a failed result when the type server cannot start", async () => {
    const fs = createAuditTestFilesystem({ [sourcePath]: "type BoxProps = Base & { b: string };\n" });

    const result = await runPropsAudit(fs, { rootDir, targetPath: rootDir, allowlist: [] }, async () => {
      throw new Error("no type server");
    });

    expect(result.ok).toBe(false);
  });
});
