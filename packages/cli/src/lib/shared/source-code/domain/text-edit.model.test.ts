import {
  applyEditsDescending,
  indentOfLineContaining,
} from "#/lib/shared/source-code/domain/text-edit.model";

describe("indentOfLineContaining", () => {
  it("handles CRLF files", () => {
    const src = "a\r\n  b\r\n\tc";
    expect(indentOfLineContaining(src, src.indexOf("b"))).toBe("  ");
  });

  it("handles CR-only line endings", () => {
    const src = "a\r\t  b\rc";
    expect(indentOfLineContaining(src, src.indexOf("b"))).toBe("\t  ");
  });

  it("supports pos at start and end of source", () => {
    const src = "x\n  y\n";
    expect(indentOfLineContaining(src, 0)).toBe("");
    expect(indentOfLineContaining(src, src.length)).toBe("");
  });

  it("returns mixed tab/space indentation", () => {
    const src = "\t  line";
    expect(indentOfLineContaining(src, src.indexOf("line"))).toBe("\t  ");
  });
});

describe("applyEditsDescending", () => {
  it("returns original text for empty edits", () => {
    expect(applyEditsDescending("abc", [])).toBe("abc");
  });

  it("applies multiple edits at start/middle/end", () => {
    const out = applyEditsDescending("abcdef", [
      { start: 0, end: 1, replacement: "A" },
      { start: 2, end: 4, replacement: "CD" },
      { start: 5, end: 6, replacement: "F" },
    ]);
    expect(out).toBe("AbCDeF");
  });
});
