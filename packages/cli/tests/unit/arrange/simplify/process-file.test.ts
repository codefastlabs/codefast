import { describe, expect, it } from "vitest";

import { processArrangeSimplifyFile } from "#/arrange/simplify/process-file";
import type { Filesystem } from "#/core/filesystem/filesystem";

/** A read-only filesystem exposing a single file's text; only the reads process-file makes are backed. */
function fileWith(text: string): Filesystem {
  return {
    readFileSync: () => text,
    writeFileSync: () => undefined,
  } as unknown as Filesystem;
}

function run(text: string): { totalFound: number } {
  return processArrangeSimplifyFile(fileWith(text), { filePath: "/virtual/x.tsx", write: false });
}

describe("simplify process-file marker pre-filter", () => {
  it("treats a file with no cn/tv/className marker as a no-op", () => {
    expect(run(`export const x = 1;\nfunction add(a: number, b: number) { return a + b; }\n`).totalFound).toBe(0);
  });

  it("still processes a marker-less-looking file that only imports an unused cn", () => {
    // `cn` the identifier trips the marker, so the pass runs and prunes the dead import.
    expect(run(`import { cn } from "#/lib/utils";\nexport const x = 1;\n`).totalFound).toBe(1);
  });

  it("flattens and prunes an all-static cn() call", () => {
    // The all-static cn() unwraps to a string, which leaves the cn import unused and dropped.
    expect(run(`import { cn } from "#/lib/utils";\nconst a = cn("flex", "gap-2");\n`).totalFound).toBe(2);
  });
});
