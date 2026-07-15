import { describe, expect, it } from "vitest";

import { auditFileContent } from "#/audit/domain/audit-file";
import { splitClassName } from "#/audit/domain/tokenize";

describe("splitClassName", () => {
  it("splits variant, value, and opacity modifier", () => {
    expect(splitClassName("hover:ml-2/50")).toEqual(["hover", "ml-2", "50"]);
  });

  it("keeps colons inside arbitrary brackets in the variant", () => {
    expect(splitClassName("data-[side=left]:border-l")).toEqual(["data-[side=left]", "border-l", null]);
  });
});

describe("auditFileContent", () => {
  it("flags physical margin utilities with a logical suggestion", () => {
    const violations = auditFileContent(`const c = "flex ml-2 pr-4";`);
    expect(violations).toEqual([
      { line: 1, raw: "ml-2", suggestion: "ms-2" },
      { line: 1, raw: "pr-4", suggestion: "pe-4" },
    ]);
  });

  it("skips physical classes under a physical side variant", () => {
    const violations = auditFileContent(`const c = "data-[side=left]:border-l";`);
    expect(violations).toEqual([]);
  });

  it("requires an rtl companion for translate-x", () => {
    expect(auditFileContent(`const c = "translate-x-1";`)).toEqual([
      {
        line: 1,
        raw: "translate-x-1",
        suggestion: "add rtl:-translate-x-1 (or rtl:…:-translate-x-1)",
      },
    ]);
    expect(auditFileContent(`const c = "translate-x-1 rtl:-translate-x-1";`)).toEqual([]);
  });

  it("does not flag translate-x-0", () => {
    expect(auditFileContent(`const c = "translate-x-0";`)).toEqual([]);
  });

  it("requires rtl:space-x-reverse for space-x", () => {
    expect(auditFileContent(`const c = "space-x-2";`)).toEqual([
      { line: 1, raw: "space-x-2", suggestion: "add rtl:space-x-reverse" },
    ]);
    expect(auditFileContent(`const c = "space-x-2 rtl:space-x-reverse";`)).toEqual([]);
  });

  it("allows physical slides under data-[motion=...] variants", () => {
    expect(auditFileContent(`const c = "data-[motion=from-start]:slide-in-from-left-2";`)).toEqual([]);
    expect(auditFileContent(`const c = "slide-in-from-left-2";`)).toEqual([
      {
        line: 1,
        raw: "slide-in-from-left-2",
        suggestion: "check: physical slide outside a side/motion context",
      },
    ]);
  });

  it("does not treat border-ring as border-r", () => {
    expect(auditFileContent(`const c = "border-ring";`)).toEqual([]);
  });
});
