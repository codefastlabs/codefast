import type { TagResolvedTarget } from "#/lib/tag/domain/types.domain";
import { formatTargetTable } from "#/lib/tag/presentation/tag-sync.presenter";

describe("formatTargetTable", () => {
  it("aligns columns using longest package and path values", () => {
    const targets: TagResolvedTarget[] = [
      {
        packageName: "@codefast/core",
        packageDir: "/repo/packages/core",
        rootRelativeTargetPath: "packages/core/src",
        targetPath: "/repo/packages/core/src",
        source: "workspace-package-selected-src",
      },
      {
        packageName: "@codefast/benchmark-tailwind-variants",
        packageDir: "/repo/benchmarks/tailwind-variants",
        rootRelativeTargetPath: "benchmarks/tailwind-variants/src",
        targetPath: "/repo/benchmarks/tailwind-variants/src",
        source: "workspace-package-selected-src",
      },
    ];

    const table = formatTargetTable(targets, "/repo");
    const lines = table.split("\n");
    const headerLine = lines[3];
    const firstDataLine = lines[5];
    const secondDataLine = lines[6];
    if (headerLine === undefined || firstDataLine === undefined || secondDataLine === undefined) {
      throw new Error("expected table lines");
    }

    const pathHeaderIndex = headerLine.indexOf("path");
    const firstPathIndex = firstDataLine.indexOf("packages/core/src");
    const secondPathIndex = secondDataLine.indexOf("benchmarks/tailwind-variants/src");

    expect(firstPathIndex).toBe(pathHeaderIndex);
    expect(secondPathIndex).toBe(pathHeaderIndex);
  });
});
