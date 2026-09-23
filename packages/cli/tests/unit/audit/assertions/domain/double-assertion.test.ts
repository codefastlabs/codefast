import { describe, expect, it } from "vitest";

import { auditDoubleAssertionSource, DOUBLE_ASSERTION_DIRECTIVE } from "#audit/assertions/domain/double-assertion";

function audit(source: string) {
  return auditDoubleAssertionSource("a.ts", source);
}

describe("auditDoubleAssertionSource", () => {
  it("flags every spelling of an assertion through unknown or any", () => {
    const violations = audit(
      [
        "const a = value as unknown as Target;",
        "const b = (value as unknown) as Target;",
        "const c = <Target>(<unknown>value);",
        "const d = value as any as Target;",
      ].join("\n"),
    );

    expect(violations.map(({ line, raw }) => ({ line, raw }))).toStrictEqual([
      { line: 1, raw: "value as unknown as Target" },
      { line: 2, raw: "(value as unknown) as Target" },
      { line: 3, raw: "<Target>(<unknown>value)" },
      { line: 4, raw: "value as any as Target" },
    ]);
    expect(violations[0]?.reason).toContain("double assertion");
  });

  it("leaves single assertions, `as const` and a widening to unknown alone", () => {
    expect(
      audit(
        [
          "const a = value as Target;",
          "const b = [1, 2] as const;",
          "const c: unknown = value as unknown;",
          "const d = (value as Target) as Other;",
        ].join("\n"),
      ),
    ).toStrictEqual([]);
  });

  it("reports a chain once, and still sees each erasure nested inside it", () => {
    expect(audit("const a = value as unknown as unknown as Target;")).toHaveLength(1);
    expect(
      audit("const a = (inner as unknown as Wrapper).call(other as any as Arg) as unknown as Result;"),
    ).toHaveLength(3);
  });

  it("keeps an assertion its directive states a reason for, on the line above or the same line", () => {
    const source = [
      `// ${DOUBLE_ASSERTION_DIRECTIVE}: the proxy is the mock by construction`,
      "const a = proxy as unknown as Mock;",
      `const b = proxy as unknown as Mock; // ${DOUBLE_ASSERTION_DIRECTIVE}: same reason`,
    ].join("\n");

    expect(audit(source)).toStrictEqual([]);
  });

  it("reports a directive with no reason, and keeps the assertion it meant to cover", () => {
    const violations = audit([`// ${DOUBLE_ASSERTION_DIRECTIVE}`, "const a = proxy as unknown as Mock;"].join("\n"));

    expect(violations.map(({ line }) => line)).toStrictEqual([1, 2]);
    expect(violations[0]?.reason).toContain("states why after a colon");
  });

  it("reports a directive that keeps nothing, so it cannot outlive its assertion", () => {
    const violations = audit([`// ${DOUBLE_ASSERTION_DIRECTIVE}: stale`, "const a = proxy as Mock;"].join("\n"));

    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({ line: 1 });
    expect(violations[0]?.reason).toContain("keeps no double assertion");
  });

  it("skips the parse for a file that mentions neither", () => {
    expect(audit("export const answer = 42;\n")).toStrictEqual([]);
  });
});
