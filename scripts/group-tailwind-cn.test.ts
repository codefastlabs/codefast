import assert from "node:assert/strict";
import { describe, it } from "node:test";
import ts from "typescript";
import {
  formatArray,
  formatCnArguments,
  formatCnCall,
  formatJsxCnAttributeValue,
  forEachStringLiteralInClassExpression,
  mergeCnUnconditionalLiteralPoolForTest,
  suggestCnGroups,
  unwrapCnInsideTvCallReplacement,
} from "./group-tailwind-cn.ts";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Token multiset: order-independent (algorithm may reorder within concerns). */
function sortedTokens(classString: string): string[] {
  return classString.trim().split(/\s+/).filter(Boolean).sort();
}

function assertPreservesAllTokens(input: string, groups: string[]): void {
  assert.deepStrictEqual(
    sortedTokens(input),
    sortedTokens(groups.join(" ")),
    "every input token must appear exactly once in the grouped output",
  );
}

function assertSuggest(input: string, expected: string[], message?: string): void {
  const got = suggestCnGroups(input);
  assert.deepStrictEqual(got, expected, message);
  assertPreservesAllTokens(input, got);
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
      assert.deepStrictEqual(suggestCnGroups(""), []);
      assert.deepStrictEqual(suggestCnGroups("   "), []);
      assert.deepStrictEqual(suggestCnGroups("\n\t"), []);
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
      it(row.title, () => assertSuggest(row.input, row.expected));
    }

    it("command menu item: stable multi-concern split", () => {
      assertSuggest(COMMAND_MENU_ITEM_INPUT, [...COMMAND_MENU_ITEM_GROUPS]);
    });

    it("checkbox group item: many state subgroups (golden partition)", () => {
      assertSuggest(CHECKBOX_GROUP_ITEM_INPUT, [...CHECKBOX_GROUP_ITEM_GROUPS]);
    });
  });

  describe("invariant: arbitrary long inputs never drop or duplicate tokens", () => {
    it("preserves tokens on a mixed variant string", () => {
      const input =
        "md:flex p-4 bg-card text-muted-foreground hover:bg-accent aria-invalid:ring-2 [&_svg]:size-4";
      const g = suggestCnGroups(input);
      assertPreservesAllTokens(input, g);
    });
  });
});

describe("formatCnArguments", () => {
  it("renders indented string args without wrapping cn()", () => {
    assert.strictEqual(
      formatCnArguments(["flex gap-2", "text-sm"], { indent: "        " }),
      ['        "flex gap-2",', '        "text-sm"'].join("\n"),
    );
  });

  it("commaAfterLastGroup adds trailing comma on the last literal", () => {
    assert.strictEqual(
      formatCnArguments(["a", "b"], { commaAfterLastGroup: true }),
      ['  "a",', '  "b",'].join("\n"),
    );
  });

  it("omits comma on last literal when it is the final cn arg", () => {
    assert.strictEqual(formatCnArguments(["a", "b"]), ['  "a",', '  "b"'].join("\n"));
  });

  it("supports trailingClassName like formatCnCall", () => {
    assert.strictEqual(
      formatCnArguments(["a", "b"], { trailingClassName: true }),
      ['  "a",', '  "b",', "  className,"].join("\n"),
    );
  });

  it("escapes like formatCnCall", () => {
    assert.strictEqual(formatCnArguments(['x"y']), ['  "x\\"y"'].join("\n"));
  });
});

describe("formatJsxCnAttributeValue", () => {
  it("emits className={cn(...)} with line indent from source", () => {
    const source = ['      <div className="x" />'].join("\n");
    const valueStart = source.indexOf('"');
    const got = formatJsxCnAttributeValue(["flex gap-2", "text-sm"], source, valueStart);
    assert.ok(got.startsWith("{cn("));
    assert.ok(got.endsWith(")}"));
    assert.ok(got.includes('        "flex gap-2",'));
    assert.ok(got.includes('        "text-sm",'));
  });
});

describe("formatCnCall", () => {
  it("renders multiline cn() with trailing commas (oxfmt / Prettier style)", () => {
    assert.strictEqual(
      formatCnCall(["flex gap-2", "text-sm"]),
      ["cn(", '  "flex gap-2",', '  "text-sm",', ")"].join("\n"),
    );
  });

  it("omits comma on last literal when no trailing className", () => {
    assert.strictEqual(formatCnCall(["only"]), ["cn(", '  "only"', ")"].join("\n"));
  });

  it("adds className and keeps comma on last literal when requested", () => {
    assert.strictEqual(
      formatCnCall(["a", "b"], { trailingClassName: true }),
      ["cn(", '  "a",', '  "b",', "  className,", ")"].join("\n"),
    );
  });

  it("escapes backslashes in literals", () => {
    assert.strictEqual(formatCnCall(["a\\b"]), ["cn(", '  "a\\\\b"', ")"].join("\n"));
  });

  it("escapes double quotes in literals", () => {
    assert.strictEqual(formatCnCall(['x"y']), ["cn(", '  "x\\"y"', ")"].join("\n"));
  });
});

describe("formatArray", () => {
  it("renders multiline string array for tv() bases", () => {
    assert.strictEqual(formatArray(["a", "b"]), ["[", '  "a",', '  "b",', "]"].join("\n"));
  });

  it("escapes like formatCnCall", () => {
    assert.strictEqual(formatArray(['say "hi"']), ["[", '  "say \\"hi\\""', "]"].join("\n"));
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
    assert.ok(ts.isExpressionStatement(stmt));
    assert.ok(ts.isCallExpression(stmt.expression));
    return { sf, call: stmt.expression };
  }

  it("unwraps single arg to the argument source", () => {
    const src = 'cn("flex gap-2")';
    const { sf, call } = parseTopLevelCall(src);
    assert.strictEqual(unwrapCnInsideTvCallReplacement(call, src, sf), '"flex gap-2"');
  });

  it("unwraps multiple args to a multiline array", () => {
    const src = 'cn("flex gap-2", "text-sm")';
    const { sf, call } = parseTopLevelCall(src);
    const got = unwrapCnInsideTvCallReplacement(call, src, sf);
    assert.strictEqual(got, ["[", '  "flex gap-2",', '  "text-sm",', "]"].join("\n"));
  });

  it("returns undefined when cn has no arguments", () => {
    const src = "cn()";
    const { sf, call } = parseTopLevelCall(src);
    assert.strictEqual(unwrapCnInsideTvCallReplacement(call, src, sf), undefined);
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
    assert.ok(ts.isExpressionStatement(stmt));
    const call = stmt.expression;
    assert.ok(ts.isCallExpression(call));
    const arg0 = call.arguments[0];
    assert.ok(arg0 !== undefined);
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
    assert.deepStrictEqual(literalsFromArgSnippet('x ? "a" : "b"'), ["a", "b"]);
  });

  it("skips conditional branches when descendIntoConditional is false", () => {
    assert.deepStrictEqual(
      literalsFromArgSnippet('x ? "a" : "b"', { descendIntoConditional: false }),
      [],
    );
  });

  it("collects literals inside a class-expression array", () => {
    assert.deepStrictEqual(literalsFromArgSnippet('["p", "q"]'), ["p", "q"]);
  });

  it("with descendIntoConditional false, still collects unconditional array elements", () => {
    assert.deepStrictEqual(
      literalsFromArgSnippet('["p", x ? "a" : "b"]', { descendIntoConditional: false }),
      ["p"],
    );
  });

  it("walks through parentheses and satisfies / as", () => {
    assert.deepStrictEqual(literalsFromArgSnippet('(("hi" as const))'), ["hi"]);
    assert.deepStrictEqual(literalsFromArgSnippet('("x" satisfies string)'), ["x"]);
  });
});

describe("mergeCnUnconditionalLiteralPoolForTest (cn apply pool)", () => {
  it("does not merge classes from mutually exclusive ternary branches (chart.tsx)", () => {
    const pool = mergeCnUnconditionalLiteralPoolForTest(
      '"flex flex-1 justify-between leading-none", nestLabel ? "items-end" : "items-center"',
    );
    assert.strictEqual(pool, "flex flex-1 justify-between leading-none");
    const groups = suggestCnGroups(pool);
    assert.ok(!groups.some((g) => g.includes("items-center") && g.includes("items-end")));
  });

  it("does not pull pt-3 and pb-3 from both ternary branches into the static pool (legend)", () => {
    const pool = mergeCnUnconditionalLiteralPoolForTest(
      '"flex items-center justify-center gap-4", verticalAlign === "top" ? "pb-3" : "pt-3"',
    );
    assert.strictEqual(pool, "flex items-center justify-center gap-4");
    assert.ok(!pool.includes("pt-3"));
    assert.ok(!pool.includes("pb-3"));
  });

  it("merges only unconditional args when the only dynamic arg is a ternary", () => {
    assert.strictEqual(mergeCnUnconditionalLiteralPoolForTest('"a b", cond ? "c" : "d"'), "a b");
  });

  it("returns empty when every arg is a ternary", () => {
    assert.strictEqual(mergeCnUnconditionalLiteralPoolForTest('x ? "a" : "b"'), "");
  });

  it("cn([...]) array arg: literals are skipped for the apply pool (unsafe to split)", () => {
    assert.strictEqual(mergeCnUnconditionalLiteralPoolForTest('["foo", nest ? "a" : "b"]'), "");
  });

  it("direct string literal arg is merged even when another arg is a ternary", () => {
    assert.strictEqual(mergeCnUnconditionalLiteralPoolForTest('"foo", nest ? "a" : "b"'), "foo");
  });
});
