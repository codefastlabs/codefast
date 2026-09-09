import { describe, expect, it } from "vitest";

import { collectClassNameFoldTargets } from "#/arrange/simplify/fold-targets";
import type { FileClassNameProbe, VariantClassNameAcceptance } from "#/arrange/simplify/variant-classname-probe";
import { parseDomainSourceFile } from "#/arrange/source-parse";
import { applyEditsDescending } from "#/core/source-text-edit";

function probeReturning(acceptance: VariantClassNameAcceptance | null): FileClassNameProbe {
  return { classNameAcceptance: () => acceptance };
}

function fold(sourceText: string, probe: FileClassNameProbe): string {
  const sourceFile = parseDomainSourceFile("/virtual/x.tsx", sourceText);
  const edits = collectClassNameFoldTargets(sourceFile, () => probe).filter(
    (edit) => sourceText.slice(edit.start, edit.end) !== edit.replacement,
  );
  return edits.length > 0 ? applyEditsDescending(sourceText, edits) : sourceText;
}

const importCn = `import { cn } from "#/lib/utils";`;
const acceptsBoth = probeReturning({ acceptsString: true, acceptsArray: true });

describe("simplify className fold", () => {
  it("folds a single static override into the className option as a scalar string", () => {
    const source = `${importCn}\nconst a = cn(buttonVariants({ size: "sm" }), "flex-1");\n`;
    expect(fold(source, acceptsBoth)).toContain(`buttonVariants({ size: "sm", className: "flex-1" })`);
  });

  it("folds a static plus a dynamic override into a className array", () => {
    const source = `${importCn}\nconst a = cn(buttonVariants({ variant: v }), "size-4 p-0", names.next);\n`;
    expect(fold(source, acceptsBoth)).toContain(
      `buttonVariants({ variant: v, className: ["size-4 p-0", names.next] })`,
    );
  });

  it("does not fold when the options object already sets className", () => {
    const source = `${importCn}\nconst a = cn(buttonVariants({ size: "sm", className: "x" }), "flex-1");\n`;
    expect(fold(source, acceptsBoth)).toBe(source);
  });

  it("does not fold a non-object variant argument", () => {
    const source = `${importCn}\nconst a = cn(buttonVariants(tone ? { tone } : undefined), "flex-1");\n`;
    expect(fold(source, acceptsBoth)).toBe(source);
  });

  it("does not fold when the callee is not a recognized variant function", () => {
    const source = `${importCn}\nconst a = cn(buttonVariants({ size: "sm" }), "flex-1");\n`;
    expect(fold(source, probeReturning(null))).toBe(source);
  });

  it("does not fold a dynamic override when the option rejects arrays", () => {
    const source = `${importCn}\nconst a = cn(buttonVariants({ size: "sm" }), names.next);\n`;
    expect(fold(source, probeReturning({ acceptsString: true, acceptsArray: false }))).toBe(source);
  });

  it("splices className after the last property without swallowing a trailing line comment", () => {
    const source = `${importCn}\nconst a = cn(buttonVariants({\n  size: "sm", // note\n}), "flex-1");\n`;
    const out = fold(source, acceptsBoth);
    // className lands after the property, before the original comma and comment — not inside the comment.
    expect(out).toContain(`size: "sm", className: "flex-1", // note`);
    expect(out).not.toContain(`// note, className`);
  });

  it("folds into an empty options object", () => {
    const source = `${importCn}\nconst a = cn(buttonVariants({}), "flex-1");\n`;
    expect(fold(source, acceptsBoth)).toContain(`buttonVariants({ className: "flex-1" })`);
  });

  it("preserves a trailing comma already present after the last property", () => {
    const source = `${importCn}\nconst a = cn(buttonVariants({ size: "sm", }), "flex-1");\n`;
    expect(fold(source, acceptsBoth)).toContain(`buttonVariants({ size: "sm", className: "flex-1", })`);
  });
});
