import {
  escapeTsStringLiteralContent,
  formatArray,
  formatCnArguments,
  formatCnCall,
  formatJsxCnAttributeValue,
} from "#lib/arrange/domain/source-text-formatters";

describe("escapeTsStringLiteralContent", () => {
  it("escapes backslashes and quotes", () => {
    expect(escapeTsStringLiteralContent(String.raw`x\"y`)).toBe(String.raw`x\\\"y`);
  });

  it("keeps plain strings unchanged", () => {
    expect(escapeTsStringLiteralContent("plain")).toBe("plain");
  });

  it("handles empty strings", () => {
    expect(escapeTsStringLiteralContent("")).toBe("");
  });
});

describe("formatCnArguments", () => {
  it("renders indented args without wrapping cn()", () => {
    expect(formatCnArguments(["flex gap-2", "text-sm"], { indent: "    " })).toBe(
      ['    "flex gap-2",', '    "text-sm"'].join("\n"),
    );
  });

  it("adds comma on last group when commaAfterLastGroup=true", () => {
    expect(formatCnArguments(["a", "b"], { commaAfterLastGroup: true })).toBe(
      ['  "a",', '  "b",'].join("\n"),
    );
  });

  it("appends trailing className line when requested", () => {
    expect(formatCnArguments(["a", "b"], { trailingClassName: true })).toBe(
      ['  "a",', '  "b",', "  className,"].join("\n"),
    );
  });

  it("escapes literals", () => {
    expect(formatCnArguments(['x"y'])).toBe('  "x\\"y"');
  });
});

describe("formatCnCall", () => {
  it("omits trailing comma for single group", () => {
    expect(formatCnCall(["only"])).toBe(["cn(", '  "only"', ")"].join("\n"));
  });

  it("renders multiline cn() with trailing commas for multi-arg", () => {
    expect(formatCnCall(["a", "b"])).toBe(["cn(", '  "a",', '  "b",', ")"].join("\n"));
  });

  it("supports trailing className", () => {
    expect(formatCnCall(["a", "b"], { trailingClassName: true })).toContain("className,");
  });
});

describe("formatArray", () => {
  it("renders multiline string array", () => {
    expect(formatArray(["a", "b"])).toBe(["[", '  "a",', '  "b",', "]"].join("\n"));
  });
});

describe("formatJsxCnAttributeValue", () => {
  it("formats className={cn(...)} with source-derived indentation", () => {
    const source = `export function F() {\n  return <div className="x" />;\n}`;
    const valueStart = source.indexOf('"');
    const out = formatJsxCnAttributeValue(["flex gap-2", "text-sm"], source, valueStart);
    expect(out.startsWith("{cn(")).toBe(true);
    expect(out.endsWith(")}")).toBe(true);
    expect(out).toContain('"flex gap-2",');
  });
});
