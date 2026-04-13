import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ts from "typescript";
import {
  ArrangeError,
  ArrangeErrorCode,
  analyzeDirectory,
  areCnTailwindPartitionsEquivalent,
  bucketsMergeCompatible,
  classifyToken,
  createNodeCliFs,
  createNodeCliLogger,
  formatArray,
  formatCnArguments,
  formatCnCall,
  formatJsxCnAttributeValue,
  forEachStringLiteralInClassExpression,
  groupFile,
  indexOfFirstVariantColon,
  mergeCnUnconditionalLiteralPoolForTest,
  mergeEaseTimingIntoFollowingAnimatedState,
  printAnalyzeReport,
  runOnTarget,
  stateKey,
  stripVariants,
  suggestCnGroups,
  tokenizeClassString,
  unwrapCnInsideTvCallReplacement,
  walkTsxFiles,
} from "#lib/arrange";

const arrangeFs = createNodeCliFs();
const arrangeLogger = createNodeCliLogger();

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
  "rounded-sm border border-input shadow-xs outline-hidden",
  "text-primary-foreground",
  "transition",
  "hover:not-disabled:not-aria-checked:border-ring/60",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:opacity-50",
  "aria-checked:border-primary aria-checked:bg-primary",
  "focus-visible:aria-checked:ring-primary/20",
  "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
  "hover:not-disabled:not-aria-checked:aria-invalid:border-destructive/60",
  "aria-checked:aria-invalid:bg-destructive",
  "dark:bg-input/30",
  "dark:focus-visible:aria-checked:ring-primary/40",
  "dark:aria-invalid:ring-destructive/40",
] as const;

const COMMAND_MENU_ITEM_INPUT =
  "group/cmd relative flex items-center gap-x-2 px-2 py-1.5 rounded-sm text-sm cursor-default outline-hidden select-none";

const COMMAND_MENU_ITEM_GROUPS = [
  "group/cmd relative flex items-center gap-x-2",
  "px-2 py-1.5",
  "rounded-sm outline-hidden",
  "text-sm",
  "cursor-default select-none",
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
        title: "layout + typography merge when adjacent (COMPATIBLE_BUCKET_SETS)",
        input: "flex gap-2 text-sm",
        expected: ["flex gap-2 text-sm"],
      },
      {
        title: "sizing bucket then shape",
        input: "w-4 h-4 rounded-md",
        expected: ["w-4 h-4", "rounded-md"],
      },
      {
        title: "shadow (outline overlay) is ordered before motion (transition) in pipeline",
        input: "transition outline-hidden",
        expected: ["outline-hidden", "transition"],
      },
      {
        title: "typography stays separate from shadow overlay and motion",
        input: "text-sm transition outline-hidden",
        expected: ["outline-hidden", "text-sm", "transition"],
      },
      {
        title: "orphan ease-* merges into following state chunk that uses animate-*",
        input: "ease-ui data-open:animate-in data-open:fade-in-0",
        expected: ["ease-ui data-open:animate-in data-open:fade-in-0"],
      },
      {
        title: "ease-* skips intermediate state chunks to merge with later animate state",
        input:
          "fixed z-50 inset-0 grid grid-rows-[1fr_auto] justify-items-center overflow-auto ease-ui sm:grid-rows-[1fr_auto_3fr] sm:p-4 data-open:animate-in data-open:fade-in-0",
        expected: [
          "fixed z-50 inset-0 grid grid-rows-[1fr_auto] justify-items-center overflow-auto",
          "sm:grid-rows-[1fr_auto_3fr] sm:p-4",
          "ease-ui data-open:animate-in data-open:fade-in-0",
        ],
      },
      {
        title: "ease-* skips group-data state chunk to reach animate state",
        input:
          "flex ease-ui group-data-[side=right]:rotate-90 group-data-[state=open]:grid-cols-2 data-open:animate-in data-open:fade-in-0",
        expected: [
          "flex",
          "group-data-[side=right]:rotate-90",
          "group-data-[state=open]:grid-cols-2",
          "ease-ui data-open:animate-in data-open:fade-in-0",
        ],
      },
      {
        title: "ease-* stays standalone when no later state chunk uses animate-*",
        input: "ease-ui sm:p-4 sm:gap-2",
        expected: ["ease-ui", "sm:p-4 sm:gap-2"],
      },
      {
        title: "position + sizing without layout bridge splits (no direct position↔sizing pair)",
        input: "fixed inset-0 overflow-auto",
        expected: ["fixed inset-0", "overflow-auto"],
      },
      {
        title: "position + layout + sizing stays one chunk via pairwise bridge",
        input: "fixed inset-0 grid overflow-auto",
        expected: ["fixed inset-0 grid overflow-auto"],
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
      const suggestedGroups = suggestCnGroups(input);
      expect(sortedTokens(input)).toEqual(sortedTokens(suggestedGroups.join(" ")));
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
      const suggestedGroups = suggestCnGroups(input);
      // Semantic state chunks are no longer force-merged across incompatible boundaries to stay ≤24.
      expect(suggestedGroups.length).toBeGreaterThan(20);
      expect(sortedTokens(input)).toEqual(sortedTokens(suggestedGroups.join(" ")));
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
        title: "transform / translate / scale are composite (incl. negatives)",
        input: "transform -translate-x-2 -scale-95",
        expected: ["transform -translate-x-2 -scale-95"],
      },
      {
        title: "-divide-* stays shape with divide-*",
        input: "-divide-x -divide-white/20",
        expected: ["-divide-x -divide-white/20"],
      },
      {
        title: "sizing + composite merge when adjacent (e.g. width + scale)",
        input: "-scale-95 w-full",
        expected: ["w-full -scale-95"],
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
    it("may place bg + outline-hidden in one chunk (background ↔ shadow compatibility)", () => {
      const pool =
        "flex items-center justify-center bg-border outline-hidden focus-visible:bg-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-[orientation=horizontal]:h-px aria-[orientation=vertical]:w-px";
      const suggestedGroups = suggestCnGroups(pool);
      expect(
        suggestedGroups.some(
          (chunk) => /\bbg-border\b/.test(chunk) && /\boutline-hidden\b/.test(chunk),
        ),
      ).toBe(true);
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

  it("collects literals from a parenthesized string arg (non-direct string literal)", () => {
    expect(mergeCnUnconditionalLiteralPoolForTest('(("flex gap-2" as const))')).toBe("flex gap-2");
  });

  it("collects literals from a no-substitution template literal arg", () => {
    expect(mergeCnUnconditionalLiteralPoolForTest("`flex gap-2`")).toBe("flex gap-2");
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
      const groupFileResult = groupFile(
        filePath,
        { write: true, withClassName: false },
        arrangeFs,
        arrangeLogger,
      );
      expect(groupFileResult.changed).toBeGreaterThan(0);
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
      const groupFileResult = groupFile(
        filePath,
        { write: true, withClassName: false },
        arrangeFs,
        arrangeLogger,
      );
      expect(groupFileResult.changed).toBeGreaterThan(0);
      const after = fs.readFileSync(filePath, "utf8");
      expect(after.includes("{cn(")).toBe(true);
      expect(after.includes('import { cn } from "@codefast/tailwind-variants"')).toBe(true);
    });
  });

  it("converts long JSX className when the value is a string inside `{…}` (JsxExpression)", () => {
    const before = `export function Fixture() {
  return <div className={"flex items-center gap-2 px-4 py-2 text-sm rounded-md border bg-card"} />;
}
`;
    withTempFixture("FixtureJsxBraceStr.tsx", before, (filePath) => {
      const groupFileResult = groupFile(
        filePath,
        { write: true, withClassName: false },
        arrangeFs,
        arrangeLogger,
      );
      expect(groupFileResult.changed).toBeGreaterThan(0);
      const after = fs.readFileSync(filePath, "utf8");
      expect(after.includes("{cn(")).toBe(true);
    });
  });

  it("inserts cn import after use client when grouping JSX className", () => {
    const before = `"use client";

export function Fixture() {
  return <div className="flex items-center gap-2 px-4 py-2 text-sm rounded-md border bg-card" />;
}
`;
    withTempFixture("FixtureUseClient.tsx", before, (filePath) => {
      const groupFileResult = groupFile(
        filePath,
        { write: true, withClassName: false },
        arrangeFs,
        arrangeLogger,
      );
      expect(groupFileResult.changed).toBeGreaterThan(0);
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
      const groupFileResult = groupFile(
        filePath,
        { write: true, withClassName: false },
        arrangeFs,
        arrangeLogger,
      );
      expect(groupFileResult.changed).toBeGreaterThan(0);
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
      const groupFileResult = groupFile(
        filePath,
        { write: true, withClassName: false },
        arrangeFs,
        arrangeLogger,
      );
      expect(groupFileResult.changed).toBeGreaterThan(0);
    });
  });

  it("recognizes cn/tv from modules whose path contains /utils/", () => {
    const before = `import { cn, tv } from "pkg/utils/cn";

export const styles = tv({
  base: cn("flex gap-2 text-sm rounded-md border px-3 font-medium hover:bg-accent"),
});
`;
    withTempFixture("FixtureUtilsPath.tsx", before, (filePath) => {
      const groupFileResult = groupFile(
        filePath,
        { write: true, withClassName: false },
        arrangeFs,
        arrangeLogger,
      );
      expect(groupFileResult.changed).toBeGreaterThan(0);
    });
  });

  it("recognizes cn/tv from a ./cn.ts shim filename", () => {
    const before = `import { cn, tv } from "./cn.ts";

export const styles = tv({
  base: cn("flex gap-2 text-sm rounded-md border px-3 font-medium hover:bg-accent"),
});
`;
    withTempFixture("FixtureCnTs.tsx", before, (filePath) => {
      const groupFileResult = groupFile(
        filePath,
        { write: true, withClassName: false },
        arrangeFs,
        arrangeLogger,
      );
      expect(groupFileResult.changed).toBeGreaterThan(0);
    });
  });

  it("recognizes namespace imports from known cn/tv modules", () => {
    const before = `import * as tw from "tailwind-variants";

export const styles = tw.tv({
  base: tw.cn("flex gap-2 text-sm rounded-md border px-3 font-medium hover:bg-accent"),
});
`;
    withTempFixture("FixtureNamespace.tsx", before, (filePath) => {
      const groupFileResult = groupFile(
        filePath,
        { write: true, withClassName: false },
        arrangeFs,
        arrangeLogger,
      );
      expect(groupFileResult.changed).toBeGreaterThan(0);
    });
  });

  it("ignores unrelated imports when resolving cn/tv bindings", () => {
    const before = `import { cn } from "tailwind-variants";
import { debounce } from "lodash";

cn("${COMMAND_MENU_ITEM_INPUT}");
`;
    withTempFixture("FixtureExtraImport.tsx", before, (filePath) => {
      const groupFileResult = groupFile(
        filePath,
        { write: true, withClassName: false },
        arrangeFs,
        arrangeLogger,
      );
      expect(groupFileResult.changed).toBeGreaterThan(0);
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
        .mockImplementation((chunk: string | Uint8Array) => {
          chunks.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"));
          return true;
        });
      try {
        groupFile(filePath, { write: false, withClassName: false }, arrangeFs, arrangeLogger);
      } finally {
        spy.mockRestore();
      }
      const out = chunks.join("");
      expect(out).toContain("[cn] / [tv] / [JSX className]");
    });
  });

  it("counts cn() inside tv with zero args in totalFound for preview and apply", () => {
    const before = `import { cn, tv } from "tailwind-variants";

export const broken = tv({
  base: cn(),
});
`;
    withTempFixture("FixtureZeroArg.tsx", before, (filePath) => {
      const dry = groupFile(
        filePath,
        { write: false, withClassName: false },
        arrangeFs,
        arrangeLogger,
      );
      expect(dry.changed).toBe(0);
      expect(dry.totalFound).toBe(1);

      const wet = groupFile(
        filePath,
        { write: true, withClassName: false },
        arrangeFs,
        arrangeLogger,
      );
      expect(wet.changed).toBe(0);
      expect(wet.totalFound).toBe(1);
    });
  });

  it("returns totalFound 0 for files with no cn/tv/long class targets", () => {
    const before = `export const only = 1;
`;
    withTempFixture("FixtureEmpty.tsx", before, (filePath) => {
      expect(
        groupFile(filePath, { write: false, withClassName: false }, arrangeFs, arrangeLogger),
      ).toEqual({
        filePath,
        totalFound: 0,
        changed: 0,
      });
    });
  });

  it("dry-run returns totalFound 0 when cn splits are already idempotent (no edits)", () => {
    const before = `import { cn } from "tailwind-variants";

cn("flex gap-2");
`;
    withTempFixture("FixtureShortCn.tsx", before, (filePath) => {
      expect(
        groupFile(filePath, { write: false, withClassName: false }, arrangeFs, arrangeLogger),
      ).toEqual({
        filePath,
        totalFound: 0,
        changed: 0,
      });
    });
  });

  it("dry-run skips cn when static arg partitions already match suggestCnGroups output", () => {
    const before = `import { cn } from "tailwind-variants";

cn("flex gap-2", "text-sm");
`;
    withTempFixture("FixturePartitionEq.tsx", before, (filePath) => {
      expect(
        groupFile(filePath, { write: false, withClassName: false }, arrangeFs, arrangeLogger),
      ).toEqual({
        filePath,
        totalFound: 0,
        changed: 0,
      });
    });
  });

  it("inserts cn import before the first existing import when adding JSX cn", () => {
    const before = `import React from "react";

export function Fixture() {
  return <div className="flex items-center gap-2 px-4 py-2 text-sm rounded-md border bg-card" />;
}
`;
    withTempFixture("FixtureImportOrder.tsx", before, (filePath) => {
      const groupFileResult = groupFile(
        filePath,
        { write: true, withClassName: false },
        arrangeFs,
        arrangeLogger,
      );
      expect(groupFileResult.changed).toBeGreaterThan(0);
      const after = fs.readFileSync(filePath, "utf8");
      const cnIdx = after.indexOf("import { cn }");
      const reactIdx = after.indexOf("import React");
      expect(cnIdx).toBeLessThan(reactIdx);
    });
  });

  it("groups tv compoundVariants whose className is a merged string array slot", () => {
    const before = `import { tv } from "tailwind-variants";

export const sheet = tv({
  compoundVariants: [
    {
      className: [
        "flex gap-2 text-sm rounded-md border px-3 font-medium hover:bg-accent",
        "shadow-xs outline-hidden",
      ],
    },
  ],
});
`;
    withTempFixture("FixtureCvClassArray.tsx", before, (filePath) => {
      const groupFileResult = groupFile(
        filePath,
        { write: true, withClassName: false },
        arrangeFs,
        arrangeLogger,
      );
      expect(groupFileResult.changed).toBeGreaterThan(0);
    });
  });

  it("groups tv compoundVariants class array slot that mixes plain strings and cn(...)", () => {
    const long =
      "flex gap-2 text-sm rounded-md border px-3 font-medium hover:bg-accent shadow-xs outline-hidden";
    const before = `import { cn, tv } from "tailwind-variants";

export const sheet = tv({
  compoundVariants: [
    {
      class: ["py-1", cn("${long}")],
    },
  ],
});
`;
    withTempFixture("FixtureCvClassCn.tsx", before, (filePath) => {
      const groupFileResult = groupFile(
        filePath,
        { write: true, withClassName: false },
        arrangeFs,
        arrangeLogger,
      );
      expect(groupFileResult.changed).toBeGreaterThan(0);
    });
  });

  it("formats cn(...) replacement when static pool splits and dynamic args follow", () => {
    const before = `import { cn } from "tailwind-variants";

export function Row({ className }: { className?: string }) {
  return cn(
    "flex gap-2 text-sm rounded-md border px-3 font-medium hover:bg-accent shadow-xs",
    className,
  );
}
`;
    withTempFixture("FixtureCnDynamic.tsx", before, (filePath) => {
      const groupFileResult = groupFile(
        filePath,
        { write: true, withClassName: false },
        arrangeFs,
        arrangeLogger,
      );
      expect(groupFileResult.changed).toBeGreaterThan(0);
      const after = fs.readFileSync(filePath, "utf8");
      expect(after.includes("className")).toBe(true);
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

describe("bucketsMergeCompatible", () => {
  it("never merges arbitrary buckets (prevents singleton merge dump buckets)", () => {
    expect(bucketsMergeCompatible("arbitrary", "arbitrary")).toBe(false);
    expect(bucketsMergeCompatible("arbitrary", "state")).toBe(false);
    expect(bucketsMergeCompatible("layout", "arbitrary")).toBe(false);
  });
});

describe("stateKey", () => {
  it("uses the full variant stack so same outer @md/foo does not collapse unrelated utilities", () => {
    expect(stateKey("@md/field-group:[&>*]:w-auto")).not.toBe(
      stateKey("@md/field-group:[&>[data-slot=field-label]]:flex-auto"),
    );
  });

  it("preserves single-layer data variant stem", () => {
    expect(stateKey("data-[state=open]:opacity-100")).toBe("data-[state=open]");
  });

  it("normalizes in-data-[…] bracket stem like data-[…]", () => {
    expect(stateKey("in-data-[slot=tooltip-content]:bg-background/20")).toBe(
      "in-data-[slot=tooltip-content]",
    );
  });

  it("keeps distinct keys for in-data-side-* stems", () => {
    expect(stateKey("in-data-side-right:cursor-e-resize")).toBe("in-data-side-right");
    expect(stateKey("in-data-side-left:cursor-w-resize")).not.toBe(
      stateKey("in-data-side-right:cursor-e-resize"),
    );
  });
});

describe("suggestCnGroups (field.tv responsive row)", () => {
  const FIELD_RESPONSIVE_ROW =
    "[&>*]:w-full @md/field-group:[&>*]:w-auto [&>.sr-only]:w-auto @md/field-group:[&>[data-slot=field-label]]:flex-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px";

  it("splits each state token into its own chunk (no mixed dump bucket)", () => {
    expect(suggestCnGroups(FIELD_RESPONSIVE_ROW)).toEqual([
      "[&>*]:w-full",
      "@md/field-group:[&>*]:w-auto",
      "[&>.sr-only]:w-auto",
      "@md/field-group:[&>[data-slot=field-label]]:flex-auto",
      "@md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
    ]);
  });
});

describe("indexOfFirstVariantColon + stripVariants", () => {
  it("ignores colons inside square brackets for variant boundaries", () => {
    const tok = "[&_a:hover]:text-red-500";
    expect(indexOfFirstVariantColon(tok)).toBe("[&_a:hover]".length);
    expect(stripVariants(tok)).toBe("text-red-500");
    expect(stripVariants("[&_a:hover]:focus:text-blue-500")).toBe("text-blue-500");
  });

  it("strips stacked arbitrary container query variants", () => {
    expect(stripVariants("@min-[600px]:@max-[900px]:hidden")).toBe("hidden");
  });

  it("preserves data-[…] bracket boundaries", () => {
    expect(stripVariants("data-[state=open]:opacity-100")).toBe("opacity-100");
    expect(stateKey("data-[state=open]:opacity-100")).toBe("data-[state=open]");
  });
});

describe("classifyToken", () => {
  it("maps representative utilities to buckets", () => {
    expect(classifyToken("flex")).toBe("layout");
    expect(classifyToken("w-4")).toBe("sizing");
    expect(classifyToken("px-3")).toBe("spacing");
    expect(classifyToken("rounded-md")).toBe("shape");
    expect(classifyToken("text-sm")).toBe("typography");
    expect(classifyToken("transition")).toBe("motion");
    expect(classifyToken("outline-hidden")).toBe("shadow");
    expect(classifyToken("outline-2")).toBe("shadow");
    expect(classifyToken("outline-ring")).toBe("shadow");
    expect(classifyToken("focus-visible:outline-hidden")).toBe("state");
    expect(classifyToken("hover:opacity-80")).toBe("state");
    expect(classifyToken("[&_svg]:size-4")).toBe("state");
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
    expect(classifyToken("cursor")).toBe("behavior");
    expect(classifyToken("resize-y")).toBe("behavior");
    expect(classifyToken("starting:opacity-0")).toBe("starting");
    expect(classifyToken("custom-variant:text-sm")).toBe("typography");
  });

  it("classifies Tailwind v4 container query and named-container tokens", () => {
    expect(classifyToken("@[1024px]:flex-row")).toBe("state");
    expect(classifyToken("@min-[600px]:@max-[900px]:hidden")).toBe("state");
    expect(classifyToken("@container/sidebar")).toBe("existence");
    expect(classifyToken("@md/sidebar:w-full")).toBe("state");
    expect(classifyToken("md/sidebar:w-full")).toBe("state");
  });

  it("classifies arbitrary variant chains and data variants", () => {
    expect(classifyToken("[&_a:hover]:focus:text-blue-500")).toBe("state");
    expect(classifyToken("data-[state=open]:opacity-100")).toBe("state");
  });

  it("classifies in-data-* (ancestor data context) as state", () => {
    expect(classifyToken("in-data-[slot=tooltip-content]:bg-background/20")).toBe("state");
    expect(classifyToken("in-data-[slot=tooltip-content]:text-background")).toBe("state");
    expect(classifyToken("in-data-side-right:cursor-e-resize")).toBe("state");
    expect(classifyToken("in-data-side-left:cursor-w-resize")).toBe("state");
  });

  it("classifies long arbitrary parent selectors [&_…] as state (variant-like scoping)", () => {
    const long =
      "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50";
    for (const t of long.split(/\s+/)) {
      expect(classifyToken(t)).toBe("state");
    }
  });

  it("classifies arbitrary parent-selector forms as state", () => {
    expect(classifyToken("[&_svg]:shrink-0")).toBe("state");
    expect(classifyToken("[&_.some-lib-class]:fill-muted-foreground")).toBe("state");
    expect(classifyToken("[&[data-state=open]>svg]:rotate-180")).toBe("state");
    expect(classifyToken("[&>a]:underline")).toBe("state");
  });

  it("does not classify pure arbitrary properties (no &) as state", () => {
    expect(classifyToken("[--my-var:1rem]")).toBe("arbitrary");
    expect(classifyToken("[color:red]")).toBe("arbitrary");
  });
});

describe("suggestCnGroups (in-data-* state variants)", () => {
  it("splits kbd-style base surface from in-data-[slot=…] tokens", () => {
    const input =
      "rounded-md bg-muted in-data-[slot=tooltip-content]:bg-background/20 font-sans text-xs font-medium text-muted-foreground in-data-[slot=tooltip-content]:text-background";
    const got = suggestCnGroups(input);
    expect(got.some((c) => c.includes("bg-muted") && !c.includes("in-data-"))).toBe(true);
    expect(got.some((c) => c.includes("in-data-[slot=tooltip-content]:bg-background"))).toBe(true);
    expect(got.some((c) => c.includes("text-muted-foreground") && !c.includes("in-data-"))).toBe(
      true,
    );
    expect(got.some((c) => c.includes("in-data-[slot=tooltip-content]:text-background"))).toBe(
      true,
    );
    expect(sortedTokens(input)).toEqual(sortedTokens(got.join(" ")));
  });

  it("splits sidebar-style motion+sizing from in-data-side-* cursor utilities", () => {
    const input =
      "w-4 -translate-x-1/2 transition-all ease-linear in-data-side-right:cursor-e-resize in-data-side-left:cursor-w-resize";
    const got = suggestCnGroups(input);
    const base = got.find((c) => c.includes("w-4") && c.includes("ease-linear"));
    expect(base).toBeDefined();
    expect(base).not.toMatch(/in-data-/);
    expect(got.some((c) => c.includes("in-data-side-right"))).toBe(true);
    expect(got.some((c) => c.includes("in-data-side-left"))).toBe(true);
    expect(sortedTokens(input)).toEqual(sortedTokens(got.join(" ")));
  });
});

describe("suggestCnGroups (arbitrary parent selectors)", () => {
  it("splits base utilities from [&_…] tokens into separate chunks", () => {
    const input = "flex gap-2 text-sm [&_svg]:size-4 [&_button]:rounded-md";
    const got = suggestCnGroups(input);
    expect(got.some((c) => c.includes("flex") && !c.includes("[&"))).toBe(true);
    expect(got.filter((c) => /\[&/.test(c)).length).toBeGreaterThanOrEqual(1);
    expect(got.join(" ").split(/\s+/).sort()).toEqual(input.split(/\s+/).sort());
  });

  it("splits chart-style flex row from scoped recharts arbitrary selectors", () => {
    const input =
      "flex justify-center aspect-video text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-layer]:outline-hidden";
    const got = suggestCnGroups(input);
    expect(got[0]).toMatch(/flex|justify-center|aspect-video|text-xs/);
    expect(got[0]).not.toContain("[&");
    expect(got.some((c) => c.includes("[&_.recharts-cartesian-axis"))).toBe(true);
    expect(got.some((c) => c.includes("[&_.recharts-layer]"))).toBe(true);
    expect(sortedTokens(input)).toEqual(sortedTokens(got.join(" ")));
  });

  it("matches chart.tsx cn pool: base pipeline chunk separate from all [&_…] state tokens", () => {
    const pool =
      "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden";
    const got = suggestCnGroups(pool);
    expect(got[0]).toMatch(/flex|aspect-video|justify-center|text-xs/);
    expect(got[0]).not.toContain("[&");
    expect(got.some((c) => c.includes("[&"))).toBe(true);
    expect(sortedTokens(pool)).toEqual(sortedTokens(got.join(" ")));
  });
});

describe("arrange invariants (compat merge + state split)", () => {
  it("A: adjacent compatible buckets share one chunk (bg + text)", () => {
    const got = suggestCnGroups("bg-destructive text-white");
    expect(got).toEqual(["bg-destructive text-white"]);
  });

  it("A: motion + behavior share one chunk", () => {
    expect(suggestCnGroups("transition-transform pointer-events-none")).toEqual([
      "transition-transform pointer-events-none",
    ]);
  });

  it("A: sizing + spacing share one chunk", () => {
    expect(suggestCnGroups("w-auto min-w-0 shrink-0 px-3")).toEqual([
      "w-auto min-w-0 shrink-0 px-3",
    ]);
  });

  it("A: sizing + composite + motion chain (≤2 chunks)", () => {
    const got = suggestCnGroups("w-4 -translate-x-1/2 transition-all ease-linear");
    expect(got.length).toBeLessThanOrEqual(2);
    expect(got.join(" ")).toContain("w-4");
    expect(got.join(" ")).toContain("-translate-x-1/2");
    expect(got.join(" ")).toContain("transition-all");
    expect(got.join(" ")).toContain("ease-linear");
  });

  it("B: base literals stay free of [&_…] state tokens in the first chunk", () => {
    const got = suggestCnGroups(
      "flex justify-center aspect-video text-xs [&_.recharts-layer]:outline-hidden [&_.recharts-surface]:outline-hidden",
    );
    expect(got[0]).not.toContain("[&");
    expect(got.some((c) => /\[&/.test(c))).toBe(true);
  });

  it("C: ease-only motion chunk merges into later animate state (full suggestCnGroups)", () => {
    const got = suggestCnGroups("ease-ui data-open:animate-in");
    expect(got).toEqual(["ease-ui data-open:animate-in"]);
  });

  it("D: outline-hidden stays shadow bucket", () => {
    expect(classifyToken("outline-hidden")).toBe("shadow");
  });
});

describe("mergeEaseTimingIntoFollowingAnimatedState", () => {
  it("prepends ease-only chunk before a dominant-state chunk containing animate-*", () => {
    expect(
      mergeEaseTimingIntoFollowingAnimatedState([
        "ease-ui",
        "data-open:animate-in data-open:fade-in-0",
      ]),
    ).toEqual(["ease-ui data-open:animate-in data-open:fade-in-0"]);
  });

  it("skips intermediate state chunks to merge ease with a later animate state chunk", () => {
    expect(
      mergeEaseTimingIntoFollowingAnimatedState([
        "base-tokens",
        "ease-ui",
        "sm:grid-rows-1 sm:p-4",
        "data-open:animate-in",
      ]),
    ).toEqual(["base-tokens", "sm:grid-rows-1 sm:p-4", "ease-ui data-open:animate-in"]);
  });

  it("does not merge when the next chunk has animate but is not predominantly state", () => {
    expect(
      mergeEaseTimingIntoFollowingAnimatedState(["ease-ui", "flex data-open:animate-in"]),
    ).toEqual(["ease-ui", "flex data-open:animate-in"]);
  });

  it("does not merge when the motion chunk is not only ease-*", () => {
    expect(
      mergeEaseTimingIntoFollowingAnimatedState(["transition ease-out", "data-open:animate-in"]),
    ).toEqual(["transition ease-out", "data-open:animate-in"]);
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
    const spy = jest
      .spyOn(process.stdout, "write")
      .mockImplementation((chunk: string | Uint8Array) => {
        chunks.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"));
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
      const fixturePath = path.join(dir, "TvArrays.tsx");
      fs.writeFileSync(fixturePath, src, "utf8");
      const analyzeReport = analyzeDirectory(dir, arrangeFs);
      expect(analyzeReport.files).toBe(1);
      expect(analyzeReport.tvCallExpressions).toBeGreaterThanOrEqual(1);
      expect(analyzeReport.cnInsideTvCalls.length).toBeGreaterThanOrEqual(2);
      expect(analyzeReport.longTvStringLiterals.length).toBeGreaterThanOrEqual(1);
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
      const fixturePath = path.join(dir, "Report.tsx");
      fs.writeFileSync(fixturePath, src, "utf8");
      const analyzeReport = analyzeDirectory(dir, arrangeFs);
      expect(analyzeReport.files).toBe(1);
      expect(analyzeReport.cnCallExpressions).toBeGreaterThanOrEqual(1);
      expect(analyzeReport.tvCallExpressions).toBeGreaterThanOrEqual(1);
      expect(analyzeReport.longCnStringLiterals.length).toBeGreaterThanOrEqual(1);
      expect(analyzeReport.longTvStringLiterals.length).toBeGreaterThanOrEqual(1);
      expect(analyzeReport.longJsxClassNameLiterals.length).toBeGreaterThanOrEqual(1);
      expect(analyzeReport.cnInsideTvCalls.length).toBeGreaterThanOrEqual(1);

      const printed = captureStdout(() => printAnalyzeReport(dir, analyzeReport, arrangeLogger));
      expect(printed).toContain("Path:");
      expect(printed).toContain("Long cn(...)");
      expect(printed).toContain("nested inside tv");
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
      const analyzeReport = analyzeDirectory(dir, arrangeFs);
      expect(analyzeReport.longCnStringLiterals.length).toBeGreaterThan(40);
      const printed = captureStdout(() => printAnalyzeReport(dir, analyzeReport, arrangeLogger));
      expect(printed).toMatch(/… and \d+ more/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("printAnalyzeReport truncates long tv, JSX, and cn-inside-tv sections", () => {
    const row = { file: "x.tsx", line: 1, tokenCount: 22, preview: "p".repeat(40) };
    const manyTv = Array.from({ length: 42 }, (_, i) => ({ ...row, line: i + 1 }));
    const manyJsx = Array.from({ length: 42 }, (_, i) => ({ ...row, line: i + 1 }));
    const manyNested = Array.from({ length: 42 }, (_, i) => ({
      file: "x.tsx",
      line: i + 1,
      argCount: 1,
      preview: "cn(...)",
    }));
    const printed = captureStdout(() =>
      printAnalyzeReport(
        "/tmp/arr-truncate",
        {
          files: 1,
          cnCallExpressions: 0,
          tvCallExpressions: 1,
          cnInsideTvCalls: manyNested,
          longCnStringLiterals: [],
          longTvStringLiterals: manyTv,
          longJsxClassNameLiterals: manyJsx,
        } as Parameters<typeof printAnalyzeReport>[1],
        arrangeLogger,
      ),
    );
    const matches = printed.match(/… and \d+ more/g);
    expect(matches?.length).toBeGreaterThanOrEqual(3);
  });

  it("analyze visits JSX className={identifier} without counting as long literal", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "arr-jsx-dyn-"));
    try {
      fs.writeFileSync(
        path.join(dir, "Dyn.tsx"),
        `export function F(cls: string) {
  return <div className={cls} />;
}
`,
        "utf8",
      );
      const analyzeReport = analyzeDirectory(dir, arrangeFs);
      expect(analyzeReport.files).toBe(1);
      expect(analyzeReport.longJsxClassNameLiterals.length).toBe(0);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("analyze picks up tv compoundVariants with quoted className key", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "arr-tv-quoted-"));
    const long = CHECKBOX_GROUP_ITEM_INPUT;
    try {
      fs.writeFileSync(
        path.join(dir, "Quoted.tsx"),
        `import { tv } from "tailwind-variants";

export const quotedCompoundVariants = tv({
  compoundVariants: [
    {
      "className": "${long}",
    },
  ],
});
`,
        "utf8",
      );
      const analyzeReport = analyzeDirectory(dir, arrangeFs);
      expect(analyzeReport.longTvStringLiterals.length).toBeGreaterThanOrEqual(1);
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
        .mockImplementation((chunk: string | Uint8Array) => {
          chunks.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"));
          return true;
        });
      try {
        runOnTarget(dir, { write: false, withClassName: false }, arrangeFs, arrangeLogger);
      } finally {
        spy.mockRestore();
      }
      const out = chunks.join("");
      expect(out).toContain("Total:");
      expect(out).toMatch(/to review/);
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
      const fixturePath = path.join(dir, "Apply.tsx");
      fs.writeFileSync(fixturePath, before, "utf8");
      const chunks: string[] = [];
      const spy = jest
        .spyOn(process.stdout, "write")
        .mockImplementation((chunk: string | Uint8Array) => {
          chunks.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"));
          return true;
        });
      try {
        runOnTarget(dir, { write: true, withClassName: false }, arrangeFs, arrangeLogger);
      } finally {
        spy.mockRestore();
      }
      const out = chunks.join("");
      expect(out).toContain("Applied:");
      expect(out).toMatch(/cascade|Note:/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("throws ArrangeError when the target path does not exist", () => {
    let caught: unknown;
    try {
      runOnTarget(
        path.join(os.tmpdir(), "no-such-codefast-arrange-path-xyz"),
        { write: false, withClassName: false },
        arrangeFs,
        arrangeLogger,
      );
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(ArrangeError);
    expect((caught as ArrangeError).code).toBe(ArrangeErrorCode.TARGET_NOT_FOUND);
  });
});

describe("walkTsxFiles", () => {
  it("collects .ts and .tsx but skips .d.ts", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "arr-walk-dts-"));
    try {
      fs.mkdirSync(path.join(dir, "sub"), { recursive: true });
      fs.writeFileSync(path.join(dir, "a.tsx"), "", "utf8");
      fs.writeFileSync(path.join(dir, "b.ts"), "", "utf8");
      fs.writeFileSync(path.join(dir, "c.d.ts"), "", "utf8");
      fs.writeFileSync(path.join(dir, "sub", "handwritten.d.ts"), "", "utf8");
      fs.writeFileSync(path.join(dir, "sub", "e.tsx"), "", "utf8");
      const rel = walkTsxFiles(dir, arrangeFs)
        .map((absPath) => path.relative(dir, absPath).split(path.sep).join("/"))
        .sort();
      expect(rel).toEqual(["a.tsx", "b.ts", "sub/e.tsx"]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
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
      const groupFileResult = groupFile(
        filePath,
        { write: true, withClassName: true },
        arrangeFs,
        arrangeLogger,
      );
      expect(groupFileResult.changed).toBeGreaterThan(0);
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
      const groupFileResult = groupFile(
        filePath,
        { write: true, withClassName: false, cnImport: "clsx" },
        arrangeFs,
        arrangeLogger,
      );
      expect(groupFileResult.changed).toBeGreaterThan(0);
      const after = fs.readFileSync(filePath, "utf8");
      expect(after).toContain("cn, ");
      expect(after).toContain('from "clsx"');
    });
  });
});
