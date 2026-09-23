import { describe, expect, it } from "vitest";

import { processArrangeSimplifyFile } from "#arrange/simplify/process-file";
import type { VariantClassNameProbe } from "#arrange/simplify/variant-classname-probe";
import type { Filesystem } from "#core/filesystem/filesystem";

/** A filesystem holding one file's text, backing exactly the two calls process-file makes. */
function fileWith(text: string): Pick<Filesystem, "readFileSync" | "writeFileSync"> {
  return {
    readFileSync: () => text,
    writeFileSync: () => undefined,
  };
}

function run(text: string): { totalFound: number } {
  return processArrangeSimplifyFile(fileWith(text), { filePath: "/virtual/x.tsx", write: false });
}

/** A probe whose every callee accepts both a string and an array className — isolates the edit logic. */
const acceptAllProbe: VariantClassNameProbe = {
  forFile: () => ({ classNameAcceptance: () => ({ acceptsString: true, acceptsArray: true }) }),
  dispose: () => undefined,
};

/** Runs the fold-enabled pass with write on, capturing the text written back. */
function foldWrite(text: string): string {
  let written = text;
  const fs: Pick<Filesystem, "readFileSync" | "writeFileSync"> = {
    readFileSync: () => text,
    writeFileSync: (_path, next) => {
      written = next;
    },
  };
  processArrangeSimplifyFile(fs, { filePath: "/virtual/x.tsx", write: true, probe: acceptAllProbe });
  return written;
}

describe("simplify process-file marker pre-filter", () => {
  it("treats a file with no cn/tv/className marker as a no-op", () => {
    expect(run(`export const x = 1;\nfunction add(a: number, b: number) { return a + b; }\n`).totalFound).toBe(0);
  });

  it("still processes a marker-less-looking file that only imports an unused cn", () => {
    // `cn` the identifier trips the marker, so the pass runs and prunes the dead import.
    expect(run(`import { cn } from "#lib/utils";\nexport const x = 1;\n`).totalFound).toBe(1);
  });

  it("flattens and prunes an all-static cn() call", () => {
    // The all-static cn() unwraps to a string, which leaves the cn import unused and dropped.
    expect(run(`import { cn } from "#lib/utils";\nconst a = cn("flex", "gap-2");\n`).totalFound).toBe(2);
  });
});

describe("simplify process-file overlap resolution", () => {
  it("folds nested foldable cn() calls without corrupting the output", () => {
    const source = `import { cn } from "#lib/utils";\nconst x = cn(v1({ a: 1 }), cn(v2({ b: 2 }), "z"));\n`;
    const out = foldWrite(source);
    // Only the outer call folds; the inner cn stays verbatim inside the className value — no dangling tail.
    expect(out).toContain(`const x = v1({ a: 1, className: cn(v2({ b: 2 }), "z") });`);
    expect(out).not.toContain(`})"z"`);
  });

  it("keeps a mixed cn() merge from clobbering a nested static cn()", () => {
    const source = `import { cn } from "#lib/utils";\nconst y = cn("a", "b", cn("c", "d"), other);\n`;
    const out = foldWrite(source);
    // The outer merge wins; the trailing statement terminator survives (no dropped characters).
    expect(out.trimEnd().endsWith(";")).toBe(true);
    expect(out).toContain(`cn("c", "d")`);
  });
});
