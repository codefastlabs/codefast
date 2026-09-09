import { describe, expect, it } from "vitest";

import { collectSimplifyTargets } from "#/arrange/domain/ast/simplify-targets";
import { parseDomainSourceFile } from "#/arrange/source-parse";
import { applyEditsDescending } from "#/core/source-text-edit";

function simplify(sourceText: string): string {
  const sourceFile = parseDomainSourceFile("/virtual/x.tsx", sourceText);
  const edits = collectSimplifyTargets(sourceFile).filter(
    (edit) => sourceText.slice(edit.start, edit.end) !== edit.replacement,
  );
  return edits.length > 0 ? applyEditsDescending(sourceText, edits) : sourceText;
}

const importCn = `import { cn } from "#/lib/utils";`;

describe("simplify mixed cn() merge", () => {
  it("leaves a lone static override after a dynamic argument untouched", () => {
    // Moving the string before the variant call would flip tailwind-merge precedence.
    const source = `${importCn}\nconst a = cn(buttonVariants({ size: "sm" }), "flex-1");\n`;
    expect(simplify(source)).toBe(source);
  });

  it("leaves a static sandwiched between two dynamic arguments untouched", () => {
    const source = `${importCn}\nconst a = cn(buttonVariants({ size: "sm" }), "gap-2", other);\n`;
    expect(simplify(source)).toBe(source);
  });

  it("merges adjacent statics in place, keeping the dynamic argument first", () => {
    const source = `${importCn}\nconst a = cn(buttonVariants({ size: "sm" }), "flex-1", "gap-2", other);\n`;
    const result = simplify(source);
    expect(result).toContain(`"flex-1 gap-2"`);
    // The variant call must stay ahead of the merged override string.
    expect(result.indexOf("buttonVariants")).toBeLessThan(result.indexOf(`"flex-1 gap-2"`));
  });

  it("merges leading adjacent statics without moving them past a later dynamic", () => {
    const source = `${importCn}\nconst a = cn("flex", "gap-2", buttonVariants({ size: "sm" }));\n`;
    const result = simplify(source);
    expect(result).toContain(`"flex gap-2"`);
    expect(result.indexOf(`"flex gap-2"`)).toBeLessThan(result.indexOf("buttonVariants"));
  });

  it("unwraps an all-static cn() to a plain string", () => {
    const source = `${importCn}\nconst a = cn("flex", "gap-2");\n`;
    const result = simplify(source);
    expect(result).toContain(`const a = "flex gap-2";`);
    expect(result).not.toContain("cn(");
  });
});
