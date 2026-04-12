import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ts from "typescript";
import {
  analyzeDirectory,
  areCnTailwindPartitionsEquivalent,
  classifyToken,
  formatArray,
  formatCnArguments,
  formatCnCall,
  formatJsxCnAttributeValue,
  forEachStringLiteralInClassExpression,
  groupFile,
  mergeCnUnconditionalLiteralPoolForTest,
  printAnalyzeReport,
  runOnTarget,
  suggestCnGroups,
  tokenizeClassString,
  unwrapCnInsideTvCallReplacement,
} from "#lib/arrange";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Token multiset: order-independent (algorithm may reorder within concerns). */
function sortedTokens(classString: string): string[] {
  return classString.trim().split(/\s+/).filter(Boolean).sort();
}

// ---------------------------------------------------------------------------
// Fixtures (long strings kept once; paired with golden output below)
// ---------------------------------------------------------------------------

const CHECKBOX_GROUP_ITEM_INPUT =
  "peer flex size-4 shrink-0 items-center justify-center rounded-sm border border-input text-primary-foreground shadow-xs outline-hidden transition hover:not-disabled:not-aria-checked:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-checked:border-primary aria-checked:bg-primary focus-visible:aria-checked:ring-primary/20 aria-invalid:border-destructive aria-invalid:ring-destructive/20 hover:not-disabled:not-aria-checked:aria-invalid:border-destructive/60 aria-checked:aria-invalid:bg-destructive dark:bg-input/30 dark:focus-visible:aria-checked:ring-primary/40 dark:aria-invalid:ring-destructive/40";

const CHECKBOX_GROUP_ITEM_GROUPS = [
  "peer flex items-center justify-center size-4 shrink-0",
  "rounded-sm border border-input shadow-xs",
  "text-primary-foreground",
  "transition outline-hidden",
  "hover:not-disabled:not-aria-checked:border-ring/60",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:opacity-50",
  "aria-checked:border-primary aria-checked:bg-primary",
  "focus-visible:aria-checked:ring-primary/20",
  "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
  "hover:not-disabled:not-aria-checked:aria-invalid:border-destructive/60",
  "aria-checked:aria-invalid:bg-destructive",
  "dark:bg-input/30 dark:focus-visible:aria-checked:ring-primary/40 dark:aria-invalid:ring-destructive/40",
] as const;

const COMMAND_MENU_ITEM_INPUT =
  "group/cmd relative flex items-center gap-x-2 px-2 py-1.5 rounded-sm text-sm cursor-default outline-hidden select-none";

const COMMAND_MENU_ITEM_GROUPS = [
  "group/cmd relative flex items-center gap-x-2",
  "px-2 py-1.5",
  "rounded-sm",
  "text-sm",
  "cursor-default outline-hidden select-none",
] as const;

// ---------------------------------------------------------------------------
// Suites
// ---------------------------------------------------------------------------

describe("suggestCnGroups", () => {
  describe("empty input", () => {
    it("returns [] for empty or whitespace-only strings", () => {
      expect(suggestCnGroups("")).toEqual([]);
      expect(suggestCnGroups("   ")).toEqual([]);
      expect(suggestCnGroups("\n\t")).toEqual([]);
    });
  });

  describe("golden output (partition + token preservation)", () => {
    const table: Array<{ title: string; input: string; expected: string[] }> = [
      {
        title: "single layout bucket stays one group",
        input: "flex gap-2",
        expected: ["flex gap-2"],
      },
      {
        title: "layout then typography flush into two groups",
        input: "flex gap-2 text-sm",
        expected: ["flex gap-2", "text-sm"],
      },
      {
        title: "size bucket then surface",
        input: "w-4 h-4 rounded-md",
        expected: ["w-4 h-4", "rounded-md"],
      },
      {
        title: "motion + interaction stay one pragmatic bundle",
        input: "transition outline-hidden",
        expected: ["transition outline-hidden"],
      },
      {
        title: "typography is not merged into transition/outline",
        input: "text-sm transition outline-hidden",
        expected: ["text-sm", "transition outline-hidden"],
      },
      {
        title: "responsive variant is state; single token stays one group",
        input: "sm:text-sm",
        expected: ["sm:text-sm"],
      },
      {
        title: "group-hover compound variant is state",
        input: "group-hover:bg-red-500",
        expected: ["group-hover:bg-red-500"],
      },
      {
        title: "data-[attr=value] with different bracket values split (vaul drawer directions)",
        input:
          "data-[vaul-drawer-direction=bottom]:a data-[vaul-drawer-direction=left]:b data-[vaul-drawer-direction=right]:c",
        expected: [
          "data-[vaul-drawer-direction=bottom]:a",
          "data-[vaul-drawer-direction=left]:b",
          "data-[vaul-drawer-direction=right]:c",
        ],
      },
      {
        title: "not-disabled compound variant is state",
        input: "not-disabled:opacity-50",
        expected: ["not-disabled:opacity-50"],
      },
      {
        title: "outer state key splits focus:* vs aria-disabled:*",
        input: "focus:bg-accent focus:text-accent-foreground aria-disabled:opacity-50",
        expected: ["focus:bg-accent focus:text-accent-foreground", "aria-disabled:opacity-50"],
      },
      {
        title: "data-[range-end] vs data-[range-middle] different stems",
        input: "data-[range-end=true]:rounded-md data-[range-middle=true]:rounded-none",
        expected: ["data-[range-end=true]:rounded-md", "data-[range-middle=true]:rounded-none"],
      },
      {
        title: "single utility",
        input: "grid",
        expected: ["grid"],
      },
      {
        title: "v4 @3xl container query prefix is state (leading digit after @)",
        input: "@3xl:flex @3xl:gap-4 p-4",
        expected: ["p-4", "@3xl:flex @3xl:gap-4"],
      },
      {
        title: "has-checked compound variant stays in state bucket",
        input: "bg-white has-checked:bg-indigo-50",
        expected: ["bg-white", "has-checked:bg-indigo-50"],
      },
      {
        title: "nth-3 numbered variant is state",
        input: "flex nth-3:underline",
        expected: ["flex", "nth-3:underline"],
      },
      {
        title: "pointer-coarse media variant is state",
        input: "p-2 pointer-coarse:p-4",
        expected: ["p-2", "pointer-coarse:p-4"],
      },
      {
        title: "inert variant is state",
        input: "opacity-100 inert:opacity-50",
        expected: ["opacity-100", "inert:opacity-50"],
      },
      {
        title: "in-[…] ancestor variant is state",
        input: "flex in-[.popover]:opacity-100",
        expected: ["flex", "in-[.popover]:opacity-100"],
      },
      {
        title: "* and ** child variants are state (distinct state keys stay split)",
        input: "flex *:rounded **:text-sm",
        expected: ["flex", "*:rounded", "**:text-sm"],
      },
    ];

    for (const row of table) {
      it(`[golden] ${row.title}`, () => {
        const got = suggestCnGroups(row.input);
        expect(got).toEqual(row.expected);
        expect(sortedTokens(row.input)).toEqual(sortedTokens(got.join(" ")));
      });
    }

    it("command menu item: stable multi-concern split", () => {
      const got = suggestCnGroups(COMMAND_MENU_ITEM_INPUT);
      expect(got).toEqual([...COMMAND_MENU_ITEM_GROUPS]);
      expect(sortedTokens(COMMAND_MENU_ITEM_INPUT)).toEqual(sortedTokens(got.join(" ")));
    });

    it("checkbox group item: many state subgroups (golden partition)", () => {
      const got = suggestCnGroups(CHECKBOX_GROUP_ITEM_INPUT);
      expect(got).toEqual([...CHECKBOX_GROUP_ITEM_GROUPS]);
      expect(sortedTokens(CHECKBOX_GROUP_ITEM_INPUT)).toEqual(sortedTokens(got.join(" ")));
    });
  });

  describe("invariant: arbitrary long inputs never drop or duplicate tokens", () => {
    it("preserves tokens on a mixed variant string", () => {
      const input =
        "md:flex p-4 bg-card text-muted-foreground hover:bg-accent aria-invalid:ring-2 [&_svg]:size-4";
      const g = suggestCnGroups(input);
      expect(sortedTokens(input)).toEqual(sortedTokens(g.join(" ")));
    });
  });

  describe("capGroups under many state keys", () => {
    it("caps a very large variant fan-out without dropping tokens", () => {
      const states = [
        "hover:a",
        "focus:b",
        "active:c",
        "disabled:d",
        "checked:e",
        "focus-visible:f",
        "aria-invalid:g",
        "data-open:h",
        "dark:i",
        "print:j",
        "sm:k",
        "md:l",
        "lg:m",
        "max-sm:n",
        "@md:o",
        "group-hover:p",
        "peer-focus:q",
        "not-disabled:r",
        "has-checked:s",
        "in-[.x]:t",
        "*:u",
        "**:v",
        "nth-2:w",
        "inert:x",
        "user-valid:y",
        "pointer-coarse:z",
        "portrait:aa",
        "contrast-more:ab",
        "min-[100px]:ac",
        "max-[200px]:ad",
        "starting:ae",
        "supports-[grid]:af",
        "aria-[label=a]:ag",
        "aria-[label=b]:ah",
        "data-[state=open]:ai",
        "data-[state=closed]:aj",
      ];
      const base =
        "flex gap-2 text-sm rounded-md border px-3 py-2 bg-card outline-hidden transition";
      const input = `${base} ${states.join(" ")}`;
      const g = suggestCnGroups(input);
      expect(g.length).toBeLessThanOrEqual(24);
      expect(sortedTokens(input)).toEqual(sortedTokens(g.join(" ")));
    });
  });

  describe("negated utilities (leading -) match the same buckets as positives", () => {
    const table: Array<{ title: string; input: string; expected: string[] }> = [
      {
        title: "-gap-* stays layout with flex (symmetric with gap-*)",
        input: "-gap-4 flex",
        expected: ["-gap-4 flex"],
      },
      {
        title: "-space-x-* stays layout with flex",
        input: "-space-x-4 flex",
        expected: ["-space-x-4 flex"],
      },
      {
        title: "grid, -gap-*, padding — layout then spacing",
        input: "grid -gap-4 p-4",
        expected: ["grid -gap-4", "p-4"],
      },
      {
        title: "-indent-* groups with typography like indent-*",
        input: "text-sm -indent-4",
        expected: ["text-sm -indent-4"],
      },
      {
        title: "-tracking-* groups with typography",
        input: "-tracking-widest text-sm",
        expected: ["-tracking-widest text-sm"],
      },
      {
        title: "-z-* groups with positioning utilities",
        input: "-z-10 relative",
        expected: ["-z-10 relative"],
      },
      {
        title: "transform translates / scale / rotate are motion (incl. negatives)",
        input: "transform -translate-x-2 -scale-95",
        expected: ["transform -translate-x-2 -scale-95"],
      },
      {
        title: "-divide-* stays surface with divide-*",
        input: "-divide-x -divide-white/20",
        expected: ["-divide-x -divide-white/20"],
      },
      {
        title: "size vs motion: w-full and -scale stay split by concern",
        input: "-scale-95 w-full",
        expected: ["w-full", "-scale-95"],
      },
    ];

    for (const row of table) {
      it(`[golden] ${row.title}`, () => {
        const got = suggestCnGroups(row.input);
        expect(got).toEqual(row.expected);
        expect(sortedTokens(row.input)).toEqual(sortedTokens(got.join(" ")));
      });
    }
  });

  describe("capGroups headroom", () => {
    it("keeps surface split from interaction when aria state groups raise the group count", () => {
      const pool =
        "flex items-center justify-center bg-border outline-hidden focus-visible:bg-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-[orientation=horizontal]:h-px aria-[orientation=vertical]:w-px";
      const g = suggestCnGroups(pool);
      expect(
        g.some((chunk) => /\bbg-border\b/.test(chunk) && /\boutline-hidden\b/.test(chunk)),
      ).toBe(false);
    });
  });
});

describe("areCnTailwindPartitionsEquivalent (idempotent vs formatter token order)", () => {
  it("returns true when args are reordered but each string holds the same token multiset", () => {
    expect(areCnTailwindPartitionsEquivalent(["b a", "d c"], ["a b", "c d"])).toBe(true);
  });

  it("returns true when cn arg order is permuted but partitions match", () => {
    expect(areCnTailwindPartitionsEquivalent(["c d", "a b"], ["a b", "c d"])).toBe(true);
  });

  it("returns false when partition of tokens across chunks differs", () => {
    expect(areCnTailwindPartitionsEquivalent(["a", "b c"], ["a b", "c"])).toBe(false);
  });
});

describe("formatCnArguments", () => {
  it("renders indented string args without wrapping cn()", () => {
    expect(formatCnArguments(["flex gap-2", "text-sm"], { indent: "        " })).toBe(
      ['        "flex gap-2",', '        "text-sm"'].join("\n"),
    );
  });

  it("commaAfterLastGroup adds trailing comma on the last literal", () => {
    expect(formatCnArguments(["a", "b"], { commaAfterLastGroup: true })).toBe(
      ['  "a",', '  "b",'].join("\n"),
    );
  });

  it("omits comma on last literal when it is the final cn arg", () => {
    expect(formatCnArguments(["a", "b"])).toBe(['  "a",', '  "b"'].join("\n"));
  });

  it("supports trailingClassName like formatCnCall", () => {
    expect(formatCnArguments(["a", "b"], { trailingClassName: true })).toBe(
      ['  "a",', '  "b",', "  className,"].join("\n"),
    );
  });

  it("escapes like formatCnCall", () => {
    expect(formatCnArguments(['x"y'])).toBe(['  "x\\"y"'].join("\n"));
  });
});

describe("formatJsxCnAttributeValue", () => {
  it("emits className={cn(...)} with line indent from source", () => {
    const source = ['      <div className="x" />'].join("\n");
    const valueStart = source.indexOf('"');
    const got = formatJsxCnAttributeValue(["flex gap-2", "text-sm"], source, valueStart);
    expect(got.startsWith("{cn(")).toBe(true);
    expect(got.endsWith(")}")).toBe(true);
    expect(got.includes('        "flex gap-2",')).toBe(true);
    expect(got.includes('        "text-sm",')).toBe(true);
  });
});

describe("formatCnCall", () => {
  it("renders multiline cn() with trailing commas (oxfmt / Prettier style)", () => {
    expect(formatCnCall(["flex gap-2", "text-sm"])).toBe(
      ["cn(", '  "flex gap-2",', '  "text-sm",', ")"].join("\n"),
    );
  });

  it("omits comma on last literal when no trailing className", () => {
    expect(formatCnCall(["only"])).toBe(["cn(", '  "only"', ")"].join("\n"));
  });

  it("adds className and keeps comma on last literal when requested", () => {
    expect(formatCnCall(["a", "b"], { trailingClassName: true })).toBe(
      ["cn(", '  "a",', '  "b",', "  className,", ")"].join("\n"),
    );
  });

  it("escapes backslashes in literals", () => {
    expect(formatCnCall(["a\\b"])).toBe(["cn(", '  "a\\\\b"', ")"].join("\n"));
  });

  it("escapes double quotes in literals", () => {
    expect(formatCnCall(['x"y'])).toBe(["cn(", '  "x\\"y"', ")"].join("\n"));
  });
});

describe("formatArray", () => {
  it("renders multiline string array for tv() bases", () => {
    expect(formatArray(["a", "b"])).toBe(["[", '  "a",', '  "b",', "]"].join("\n"));
  });

  it("escapes like formatCnCall", () => {
    expect(formatArray(['say "hi"'])).toBe(["[", '  "say \\"hi\\""', "]"].join("\n"));
  });
});

describe("unwrapCnInsideTvCallReplacement", () => {
  function parseTopLevelCall(sourceText: string): { sf: ts.SourceFile; call: ts.CallExpression } {
    const sf = ts.createSourceFile(
      "x.ts",
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );
    const stmt = sf.statements[0];
    if (!ts.isExpressionStatement(stmt)) {
      throw new Error("expected expression statement");
    }
    if (!ts.isCallExpression(stmt.expression)) {
      throw new Error("expected call expression");
    }
    return { sf, call: stmt.expression };
  }

  it("unwraps single arg to the argument source", () => {
    const src = 'cn("flex gap-2")';
    const { sf, call } = parseTopLevelCall(src);
    expect(unwrapCnInsideTvCallReplacement(call, src, sf)).toBe('"flex gap-2"');
  });

  it("unwraps multiple args to a multiline array", () => {
    const src = 'cn("flex gap-2", "text-sm")';
    const { sf, call } = parseTopLevelCall(src);
    const got = unwrapCnInsideTvCallReplacement(call, src, sf);
    expect(got).toBe(["[", '  "flex gap-2",', '  "text-sm",', "]"].join("\n"));
  });

  it("returns undefined when cn has no arguments", () => {
    const src = "cn()";
    const { sf, call } = parseTopLevelCall(src);
    expect(unwrapCnInsideTvCallReplacement(call, src, sf)).toBeUndefined();
  });
});

describe("forEachStringLiteralInClassExpression", () => {
  function literalsFromArgSnippet(
    snippet: string,
    walk?: { descendIntoConditional?: boolean },
  ): string[] {
    const sf = ts.createSourceFile(
      "x.ts",
      `cn(${snippet});`,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );
    const stmt = sf.statements[0];
    if (!ts.isExpressionStatement(stmt)) {
      throw new Error("expected expression statement");
    }
    const call = stmt.expression;
    if (!ts.isCallExpression(call)) {
      throw new Error("expected call expression");
    }
    const arg0 = call.arguments[0];
    if (arg0 === undefined) {
      throw new Error("expected first argument");
    }
    const out: string[] = [];
    forEachStringLiteralInClassExpression(
      arg0,
      (n) => {
        out.push(n.text);
      },
      0,
      walk,
    );
    return out;
  }

  it("collects both branches of a conditional (default walk)", () => {
    expect(literalsFromArgSnippet('x ? "a" : "b"')).toEqual(["a", "b"]);
  });

  it("skips conditional branches when descendIntoConditional is false", () => {
    expect(literalsFromArgSnippet('x ? "a" : "b"', { descendIntoConditional: false })).toEqual([]);
  });

  it("collects literals inside a class-expression array", () => {
    expect(literalsFromArgSnippet('["p", "q"]')).toEqual(["p", "q"]);
  });

  it("with descendIntoConditional false, still collects unconditional array elements", () => {
    expect(
      literalsFromArgSnippet('["p", x ? "a" : "b"]', { descendIntoConditional: false }),
    ).toEqual(["p"]);
  });

  it("walks through parentheses and satisfies / as", () => {
    expect(literalsFromArgSnippet('(("hi" as const))')).toEqual(["hi"]);
    expect(literalsFromArgSnippet('("x" satisfies string)')).toEqual(["x"]);
  });

  it("walks through non-null assertions", () => {
    expect(literalsFromArgSnippet('("a" as const)!')).toEqual(["a"]);
  });

  it("collects literals from string concatenation with +", () => {
    expect(literalsFromArgSnippet('"a" + "b"')).toEqual(["a", "b"]);
  });
});

describe("mergeCnUnconditionalLiteralPoolForTest (cn apply pool)", () => {
  it("does not merge classes from mutually exclusive ternary branches (chart.tsx)", () => {
    const pool = mergeCnUnconditionalLiteralPoolForTest(
      '"flex flex-1 justify-between leading-none", nestLabel ? "items-end" : "items-center"',
    );
    expect(pool).toBe("flex flex-1 justify-between leading-none");
    const groups = suggestCnGroups(pool);
    expect(groups.some((g) => g.includes("items-center") && g.includes("items-end"))).toBe(false);
  });

  it("does not pull pt-3 and pb-3 from both ternary branches into the static pool (legend)", () => {
    const pool = mergeCnUnconditionalLiteralPoolForTest(
      '"flex items-center justify-center gap-4", verticalAlign === "top" ? "pb-3" : "pt-3"',
    );
    expect(pool).toBe("flex items-center justify-center gap-4");
    expect(pool.includes("pt-3")).toBe(false);
    expect(pool.includes("pb-3")).toBe(false);
  });

  it("merges only unconditional args when the only dynamic arg is a ternary", () => {
    expect(mergeCnUnconditionalLiteralPoolForTest('"a b", cond ? "c" : "d"')).toBe("a b");
  });

  it("returns empty when every arg is a ternary", () => {
    expect(mergeCnUnconditionalLiteralPoolForTest('x ? "a" : "b"')).toBe("");
  });

  it("cn([...]) array arg: literals are skipped for the apply pool (unsafe to split)", () => {
    expect(mergeCnUnconditionalLiteralPoolForTest('["foo", nest ? "a" : "b"]')).toBe("");
  });

  it("direct string literal arg is merged even when another arg is a ternary", () => {
    expect(mergeCnUnconditionalLiteralPoolForTest('"foo", nest ? "a" : "b"')).toBe("foo");
  });

  it("supports an aliased callee name (import { cn as cx } …)", () => {
    expect(
      mergeCnUnconditionalLiteralPoolForTest('"a b", cond ? "c" : "d"', { callee: "cx" }),
    ).toBe("a b");
  });
});

describe("groupFile (integration)", () => {
  function withTempFixture(name: string, source: string, fn: (filePath: string) => void): void {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "group-cn-"));
    const filePath = path.join(dir, name);
    try {
      fs.writeFileSync(filePath, source, "utf8");
      fn(filePath);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  it("unwraps cn() inside tv base and splits a long class string into a tv array", () => {
    const before = `import { cn, tv } from "tailwind-variants";

export const styles = tv({
  base: cn("flex gap-2 text-sm rounded-md border px-3 font-medium"),
});
`;
    withTempFixture("FixtureTv.tsx", before, (filePath) => {
      const r = groupFile(filePath, { write: true, withClassName: false });
      expect(r.changed).toBeGreaterThan(0);
      const after = fs.readFileSync(filePath, "utf8");
      expect(after.includes("base: cn(")).toBe(false);
      expect(after.includes("[") && after.includes('"flex')).toBe(true);
    });
  });

  it("converts long static JSX className to cn(...) and inserts cn import", () => {
    const before = `export function Fixture() {
  return <div className="flex items-center gap-2 px-4 py-2 text-sm rounded-md border bg-card" />;
}
`;
    withTempFixture("FixtureJsx.tsx", before, (filePath) => {
      const r = groupFile(filePath, { write: true, withClassName: false });
      expect(r.changed).toBeGreaterThan(0);
      const after = fs.readFileSync(filePath, "utf8");
      expect(after.includes("{cn(")).toBe(true);
      expect(after.includes('import { cn } from "@codefast/tailwind-variants"')).toBe(true);
    });
  });

  it("inserts cn import after use client when grouping JSX className", () => {
    const before = `"use client";

export function Fixture() {
  return <div className="flex items-center gap-2 px-4 py-2 text-sm rounded-md border bg-card" />;
}
`;
    withTempFixture("FixtureUseClient.tsx", before, (filePath) => {
      const r = groupFile(filePath, { write: true, withClassName: false });
      expect(r.changed).toBeGreaterThan(0);
      const after = fs.readFileSync(filePath, "utf8");
      expect(after.startsWith(`"use client";`)).toBe(true);
      const useClientEnd = after.indexOf("\n", after.indexOf(`"use client"`));
      const importIdx = after.indexOf("import { cn }");
      expect(importIdx).toBeGreaterThan(useClientEnd);
    });
  });

  it("groups tv base array slots that merge cn(...) string args", () => {
    const before = `import { cn, tv } from "tailwind-variants";

export const styles = tv({
  base: [
    cn("flex gap-2 text-sm rounded-md border px-3 font-medium hover:bg-accent"),
    "shadow-sm",
  ],
});
`;
    withTempFixture("FixtureTvBaseArray.tsx", before, (filePath) => {
      const r = groupFile(filePath, { write: true, withClassName: false });
      expect(r.changed).toBeGreaterThan(0);
      const after = fs.readFileSync(filePath, "utf8");
      expect(after.includes("base:")).toBe(true);
    });
  });

  it("recognizes cn/tv imported from a local ./utils re-export path", () => {
    const before = `import { cn, tv } from "./utils";

export const styles = tv({
  base: cn("flex gap-2 text-sm rounded-md border px-3 font-medium hover:bg-accent"),
});
`;
    withTempFixture("FixtureLocalUtils.tsx", before, (filePath) => {
      const r = groupFile(filePath, { write: true, withClassName: false });
      expect(r.changed).toBeGreaterThan(0);
    });
  });

  it("recognizes cn/tv from modules whose path contains /utils/", () => {
    const before = `import { cn, tv } from "pkg/utils/cn";

export const styles = tv({
  base: cn("flex gap-2 text-sm rounded-md border px-3 font-medium hover:bg-accent"),
});
`;
    withTempFixture("FixtureUtilsPath.tsx", before, (filePath) => {
      const r = groupFile(filePath, { write: true, withClassName: false });
      expect(r.changed).toBeGreaterThan(0);
    });
  });

  it("recognizes cn/tv from a ./cn.ts shim filename", () => {
    const before = `import { cn, tv } from "./cn.ts";

export const styles = tv({
  base: cn("flex gap-2 text-sm rounded-md border px-3 font-medium hover:bg-accent"),
});
`;
    withTempFixture("FixtureCnTs.tsx", before, (filePath) => {
      const r = groupFile(filePath, { write: true, withClassName: false });
      expect(r.changed).toBeGreaterThan(0);
    });
  });

  it("ignores unrelated imports when resolving cn/tv bindings", () => {
    const before = `import { cn } from "tailwind-variants";
import { debounce } from "lodash";

cn("${COMMAND_MENU_ITEM_INPUT}");
`;
    withTempFixture("FixtureExtraImport.tsx", before, (filePath) => {
      const r = groupFile(filePath, { write: true, withClassName: false });
      expect(r.changed).toBeGreaterThan(0);
    });
  });

  it("dry-run mentions combined unwrap + grouping when both apply", () => {
    const long =
      "flex items-center gap-2 px-4 py-2 text-sm rounded-md border bg-card font-medium shadow-xs";
    const before = `import { cn, tv } from "tailwind-variants";

cn("${long}");

export const styles = tv({
  base: cn("${long}"),
});
`;
    withTempFixture("FixtureDryCombined.tsx", before, (filePath) => {
      const chunks: string[] = [];
      const spy = jest
        .spyOn(process.stdout, "write")
        .mockImplementation((c: string | Uint8Array) => {
          chunks.push(typeof c === "string" ? c : Buffer.from(c).toString("utf8"));
          return true;
        });
      try {
        groupFile(filePath, { write: false, withClassName: false });
      } finally {
        spy.mockRestore();
      }
      const out = chunks.join("");
      expect(out).toContain("Các dòng [cn]");
    });
  });

  it("counts cn() inside tv with zero args in totalFound for preview and apply", () => {
    const before = `import { cn, tv } from "tailwind-variants";

export const broken = tv({
  base: cn(),
});
`;
    withTempFixture("FixtureZeroArg.tsx", before, (filePath) => {
      const dry = groupFile(filePath, { write: false, withClassName: false });
      expect(dry.changed).toBe(0);
      expect(dry.totalFound).toBe(1);

      const wet = groupFile(filePath, { write: true, withClassName: false });
      expect(wet.changed).toBe(0);
      expect(wet.totalFound).toBe(1);
    });
  });
});

describe("tokenizeClassString", () => {
  it("trims and splits on whitespace runs", () => {
    expect(tokenizeClassString("  flex  gap-2  ")).toEqual(["flex", "gap-2"]);
  });

  it("returns empty for whitespace-only input", () => {
    expect(tokenizeClassString(" \n\t ")).toEqual([]);
  });
});

describe("classifyToken", () => {
  it("maps representative utilities to buckets", () => {
    expect(classifyToken("flex")).toBe("layout");
    expect(classifyToken("w-4")).toBe("size");
    expect(classifyToken("px-3")).toBe("spacing");
    expect(classifyToken("rounded-md")).toBe("surface");
    expect(classifyToken("text-sm")).toBe("typography");
    expect(classifyToken("transition")).toBe("motion");
    expect(classifyToken("outline-hidden")).toBe("interaction");
    expect(classifyToken("hover:opacity-80")).toBe("state");
    expect(classifyToken("[&_svg]:size-4")).toBe("arbitrary");
    expect(classifyToken("user-valid:ring-2")).toBe("state");
    expect(classifyToken("user-invalid:ring-destructive")).toBe("state");
    expect(classifyToken("pointer-fine:flex")).toBe("state");
    expect(classifyToken("any-pointer-none:flex")).toBe("state");
    expect(classifyToken("portrait:hidden")).toBe("state");
    expect(classifyToken("landscape:flex")).toBe("state");
    expect(classifyToken("noscript:hidden")).toBe("state");
    expect(classifyToken("contrast-more:opacity-100")).toBe("state");
    expect(classifyToken("contrast-less:opacity-50")).toBe("state");
    expect(classifyToken("forced-colors:bg-zinc-900")).toBe("state");
    expect(classifyToken("inverted-colors:invert")).toBe("state");
    expect(classifyToken("cursor")).toBe("interaction");
    expect(classifyToken("resize-y")).toBe("interaction");
    expect(classifyToken("custom-variant:text-sm")).toBe("typography");
  });
});

describe("formatJsxCnAttributeValue", () => {
  it("formats a multi-group cn() JSX expression with indentation from source", () => {
    const src = `export function F() {
  return <div className={"flex gap-2 text-sm rounded-md border px-3 font-medium"} />;
}`;
    const classNameIdx = src.indexOf("className=");
    const valueStart = src.indexOf("{", classNameIdx);
    const out = formatJsxCnAttributeValue(
      ["flex gap-2", "text-sm", "rounded-md border px-3 font-medium"],
      src,
      valueStart,
    );
    expect(out.startsWith("{cn(")).toBe(true);
    expect(out).toContain('"flex gap-2"');
    expect(out).toContain('"text-sm"');
  });
});

describe("analyzeDirectory + printAnalyzeReport", () => {
  function captureStdout(fn: () => void): string {
    const chunks: string[] = [];
    const spy = jest.spyOn(process.stdout, "write").mockImplementation((c: string | Uint8Array) => {
      chunks.push(typeof c === "string" ? c : Buffer.from(c).toString("utf8"));
      return true;
    });
    try {
      fn();
    } finally {
      spy.mockRestore();
    }
    return chunks.join("");
  }

  it("traverse tv array slots with nested cn and compoundVariants className arrays", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "arr-analyze-tv-arr-"));
    const long = CHECKBOX_GROUP_ITEM_INPUT;
    const src = `import { cn, tv } from "tailwind-variants";

export const styles = tv({
  base: [cn("${long}"), "py-0"],
  compoundVariants: [{ className: cn("${long}") }],
});
`;
    try {
      const fp = path.join(dir, "TvArrays.tsx");
      fs.writeFileSync(fp, src, "utf8");
      const r = analyzeDirectory(dir);
      expect(r.files).toBe(1);
      expect(r.tvCallExpressions).toBeGreaterThanOrEqual(1);
      expect(r.cnInsideTvCalls.length).toBeGreaterThanOrEqual(2);
      expect(r.longTvStringLiterals.length).toBeGreaterThanOrEqual(1);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("collects long cn / tv / JSX literals and nested cn(...) inside tv", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "arr-analyze-"));
    const long = CHECKBOX_GROUP_ITEM_INPUT;
    const src = `import { cn, tv } from "tailwind-variants";

cn("${long}");

export const styles = tv({
  base: "${long}",
  variants: { a: { b: "${long}" } },
});

export function X() {
  return <div className={"${long}"} />;
}

export function Y() {
  return <div className={\`${long}\`} />;
}

export const nested = tv({
  base: cn("x", "${long}"),
});
`;
    try {
      const fp = path.join(dir, "Report.tsx");
      fs.writeFileSync(fp, src, "utf8");
      const r = analyzeDirectory(dir);
      expect(r.files).toBe(1);
      expect(r.cnCallExpressions).toBeGreaterThanOrEqual(1);
      expect(r.tvCallExpressions).toBeGreaterThanOrEqual(1);
      expect(r.longCnStringLiterals.length).toBeGreaterThanOrEqual(1);
      expect(r.longTvStringLiterals.length).toBeGreaterThanOrEqual(1);
      expect(r.longJsxClassNameLiterals.length).toBeGreaterThanOrEqual(1);
      expect(r.cnInsideTvCalls.length).toBeGreaterThanOrEqual(1);

      const printed = captureStdout(() => printAnalyzeReport(dir, r));
      expect(printed).toContain("Đường dẫn:");
      expect(printed).toContain("Chuỗi literal trong cn");
      expect(printed).toContain("Gọi cn(...) lồng trong tv");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("truncates per-category listings after MAX_REPORT_LINES", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "arr-analyze-many-"));
    const long = CHECKBOX_GROUP_ITEM_INPUT;
    try {
      let body = `import { cn } from "tailwind-variants";\n`;
      for (let i = 0; i < 42; i++) {
        body += `cn("${long}");\n`;
      }
      fs.writeFileSync(path.join(dir, "Many.tsx"), body, "utf8");
      const r = analyzeDirectory(dir);
      expect(r.longCnStringLiterals.length).toBeGreaterThan(40);
      const printed = captureStdout(() => printAnalyzeReport(dir, r));
      expect(printed).toMatch(/vị trí khác/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("runOnTarget", () => {
  it("prints totals in dry-run mode for a directory of TSX files", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "arr-run-dry-"));
    const long = CHECKBOX_GROUP_ITEM_INPUT;
    try {
      fs.writeFileSync(
        path.join(dir, "Page.tsx"),
        `import { cn } from "tailwind-variants";
export function P() { cn("${long}"); return null; }
`,
        "utf8",
      );
      const chunks: string[] = [];
      const spy = jest
        .spyOn(process.stdout, "write")
        .mockImplementation((c: string | Uint8Array) => {
          chunks.push(typeof c === "string" ? c : Buffer.from(c).toString("utf8"));
          return true;
        });
      try {
        runOnTarget(dir, { write: false, withClassName: false });
      } finally {
        spy.mockRestore();
      }
      const out = chunks.join("");
      expect(out).toContain("Tổng:");
      expect(out).toMatch(/cần xem xét/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("prints apply summary when write mode changes files", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "arr-run-apply-"));
    const before = `import { cn } from "tailwind-variants";

export function Fixture() {
  return <div className="flex items-center gap-2 px-4 py-2 text-sm rounded-md border bg-card" />;
}
`;
    try {
      const fp = path.join(dir, "Apply.tsx");
      fs.writeFileSync(fp, before, "utf8");
      const chunks: string[] = [];
      const spy = jest
        .spyOn(process.stdout, "write")
        .mockImplementation((c: string | Uint8Array) => {
          chunks.push(typeof c === "string" ? c : Buffer.from(c).toString("utf8"));
          return true;
        });
      try {
        runOnTarget(dir, { write: true, withClassName: false });
      } finally {
        spy.mockRestore();
      }
      const out = chunks.join("");
      expect(out).toContain("Đã áp dụng");
      expect(out).toMatch(/cascade|Lưu ý/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("exits with code 1 when the target path does not exist", () => {
    const exitSpy = jest
      .spyOn(process, "exit")
      .mockImplementation((code?: string | number | null) => {
        throw new Error(`EXIT:${String(code)}`);
      });
    const errSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
    try {
      expect(() =>
        runOnTarget(path.join(os.tmpdir(), "no-such-codefast-arrange-path-xyz"), {
          write: false,
          withClassName: false,
        }),
      ).toThrow("EXIT:1");
    } finally {
      exitSpy.mockRestore();
      errSpy.mockRestore();
    }
  });
});

describe("groupFile (integration) — options", () => {
  function withTempFixture(name: string, source: string, fn: (filePath: string) => void): void {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "group-cn-opt-"));
    const filePath = path.join(dir, name);
    try {
      fs.writeFileSync(filePath, source, "utf8");
      fn(filePath);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  it("passes withClassName through to cn(...) replacement", () => {
    const before = `import { cn } from "tailwind-variants";

export function Fixture() {
  return <div className="flex items-center gap-2 px-4 py-2 text-sm rounded-md border bg-card" />;
}
`;
    withTempFixture("WithCN.tsx", before, (filePath) => {
      const r = groupFile(filePath, { write: true, withClassName: true });
      expect(r.changed).toBeGreaterThan(0);
      const after = fs.readFileSync(filePath, "utf8");
      expect(after).toContain("className");
      expect(after).toMatch(/className=\{\s*cn\(/s);
    });
  });

  it("merges cn into an existing named import when cnImport matches", () => {
    const before = `import { tv } from "clsx";

export function Fixture() {
  return <div className="flex items-center gap-2 px-4 py-2 text-sm rounded-md border bg-card" />;
}
`;
    withTempFixture("MergeImport.tsx", before, (filePath) => {
      const r = groupFile(filePath, { write: true, withClassName: false, cnImport: "clsx" });
      expect(r.changed).toBeGreaterThan(0);
      const after = fs.readFileSync(filePath, "utf8");
      expect(after).toContain("cn, ");
      expect(after).toContain('from "clsx"');
    });
  });
});
