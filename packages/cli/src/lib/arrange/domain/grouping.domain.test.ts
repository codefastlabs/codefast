import {
  areCnTailwindPartitionsEquivalent,
  capGroups,
  mergeEaseTimingIntoFollowingAnimatedState,
  mergeSingletons,
  suggestCnGroups,
  summarizeGroupBucketLabels,
} from "#lib/arrange/domain/grouping.domain";

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
  "aria-checked:bg-primary aria-checked:border-primary",
  "focus-visible:aria-checked:ring-primary/20",
  "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
  "hover:not-disabled:not-aria-checked:aria-invalid:border-destructive/60",
  "aria-checked:aria-invalid:bg-destructive",
  "dark:bg-input/30",
  "dark:focus-visible:aria-checked:ring-primary/40",
  "dark:aria-invalid:ring-destructive/40",
] as const;

function sortedTokens(classString: string): string[] {
  return classString.trim().split(/\s+/).filter(Boolean).sort();
}

describe("suggestCnGroups", () => {
  it.each([
    ["", []],
    ["   ", []],
    ["\n\t", []],
    ["flex gap-2", ["flex gap-2"]],
    ["flex gap-2 text-sm", ["flex gap-2 text-sm"]],
    ["w-4 h-4 rounded-md", ["w-4 h-4", "rounded-md"]],
    ["transition outline-hidden", ["outline-hidden", "transition"]],
    ["text-sm transition outline-hidden", ["outline-hidden", "text-sm", "transition"]],
    [
      "ease-ui data-open:animate-in data-open:fade-in-0",
      ["ease-ui data-open:animate-in data-open:fade-in-0"],
    ],
    ["fixed inset-0 overflow-auto", ["fixed inset-0", "overflow-auto"]],
    ["fixed inset-0 grid overflow-auto", ["fixed inset-0 grid overflow-auto"]],
    ["sm:text-sm", ["sm:text-sm"]],
    ["group-hover:bg-red-500", ["group-hover:bg-red-500"]],
    ["not-disabled:opacity-50", ["not-disabled:opacity-50"]],
    [
      "focus:bg-accent focus:text-accent-foreground aria-disabled:opacity-50",
      ["focus:bg-accent focus:text-accent-foreground", "aria-disabled:opacity-50"],
    ],
    ["grid", ["grid"]],
    ["@3xl:flex @3xl:gap-4 p-4", ["p-4", "@3xl:flex @3xl:gap-4"]],
    ["bg-white has-checked:bg-indigo-50", ["bg-white", "has-checked:bg-indigo-50"]],
    ["flex nth-3:underline", ["flex", "nth-3:underline"]],
    ["p-2 pointer-coarse:p-4", ["p-2", "pointer-coarse:p-4"]],
    ["opacity-100 inert:opacity-50", ["opacity-100", "inert:opacity-50"]],
    ["flex in-[.popover]:opacity-100", ["flex", "in-[.popover]:opacity-100"]],
    ["flex *:rounded **:text-sm", ["flex", "*:rounded", "**:text-sm"]],
    ["-gap-4 flex", ["-gap-4 flex"]],
    ["-space-x-4 flex", ["-space-x-4 flex"]],
    ["grid -gap-4 p-4", ["grid -gap-4", "p-4"]],
    ["-tracking-widest text-sm", ["-tracking-widest text-sm"]],
    ["-z-10 relative", ["-z-10 relative"]],
    ["-scale-95 w-full", ["w-full -scale-95"]],
    [
      "data-[vaul-drawer-direction=bottom]:a data-[vaul-drawer-direction=left]:b data-[vaul-drawer-direction=right]:c",
      [
        "data-[vaul-drawer-direction=bottom]:a",
        "data-[vaul-drawer-direction=left]:b",
        "data-[vaul-drawer-direction=right]:c",
      ],
    ],
    [
      "data-[range-end=true]:rounded-md data-[range-middle=true]:rounded-none",
      ["data-[range-end=true]:rounded-md", "data-[range-middle=true]:rounded-none"],
    ],
  ] as const)("golden groups `%s`", (input, expected) => {
    expect(suggestCnGroups(input)).toEqual(expected);
    expect(sortedTokens(input)).toEqual(sortedTokens(expected.join(" ")));
  });

  it("groups command-menu style rows deterministically", () => {
    const input =
      "group/cmd relative flex items-center gap-x-2 px-2 py-1.5 rounded-sm text-sm cursor-default outline-hidden select-none";
    const expected = [
      "group/cmd relative flex items-center gap-x-2",
      "px-2 py-1.5",
      "rounded-sm outline-hidden",
      "text-sm",
      "cursor-default select-none",
    ];
    const got = suggestCnGroups(input);
    expect(got).toEqual(expected);
    expect(sortedTokens(input)).toEqual(sortedTokens(got.join(" ")));
  });

  it("keeps checkbox-style partition stable", () => {
    const got = suggestCnGroups(CHECKBOX_GROUP_ITEM_INPUT);
    expect(got).toEqual([...CHECKBOX_GROUP_ITEM_GROUPS]);
    expect(sortedTokens(CHECKBOX_GROUP_ITEM_INPUT)).toEqual(sortedTokens(got.join(" ")));
  });

  it("keeps many state keys without dropping tokens", () => {
    const input =
      "flex gap-2 text-sm rounded-md border px-3 py-2 bg-card outline-hidden transition " +
      [
        "hover:a",
        "focus:b",
        "active:c",
        "disabled:d",
        "checked:e",
        "focus-visible:f",
        "aria-invalid:g",
        "data-open:h",
        "dark:i",
        "sm:j",
        "md:k",
        "group-hover:l",
        "peer-focus:m",
        "inert:n",
      ].join(" ");
    const groups = suggestCnGroups(input);
    expect(groups.length).toBeGreaterThan(8);
    expect(sortedTokens(input)).toEqual(sortedTokens(groups.join(" ")));
  });

  it("splits in-data variant state chunks from base utilities", () => {
    const input =
      "rounded-md bg-muted in-data-[slot=tooltip-content]:bg-background/20 font-sans text-xs font-medium text-muted-foreground in-data-[slot=tooltip-content]:text-background";
    const got = suggestCnGroups(input);
    expect(got.some((c) => c.includes("bg-muted") && !c.includes("in-data-"))).toBe(true);
    expect(got.some((c) => c.includes("in-data-[slot=tooltip-content]:bg-background/20"))).toBe(
      true,
    );
  });

  it("splits arbitrary parent selectors from base chunk", () => {
    const input =
      "flex justify-center aspect-video text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-layer]:outline-hidden";
    const got = suggestCnGroups(input);
    expect(got[0]).not.toContain("[&");
    expect(got.some((c) => c.includes("[&_.recharts-layer]"))).toBe(true);
  });

  it("merges shadcn [&_svg] utilities and :not size guard into one selector chunk", () => {
    const input =
      "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-6";
    const canonical =
      "[&_svg:not([class*='size-'])]:size-6 [&_svg]:pointer-events-none [&_svg]:shrink-0";
    expect(suggestCnGroups(input)).toEqual([canonical]);
    expect(suggestCnGroups(canonical)).toEqual([canonical]);
  });

  it("should produce identical output for same classNames in different orders", () => {
    const inputA = "focus-visible:border-ring focus-visible:ring-3";
    const inputB = "focus-visible:ring-3 focus-visible:border-ring";
    const outA = suggestCnGroups(inputA);
    const outB = suggestCnGroups(inputB);
    expect(outA).toEqual(outB);
    expect(outA).toEqual(["focus-visible:border-ring focus-visible:ring-3"]);
    expect(summarizeGroupBucketLabels(outA)).toEqual(summarizeGroupBucketLabels(outB));
  });

  it("keeps cap-groups headroom behavior for bg + outline-hidden", () => {
    const pool =
      "flex items-center justify-center bg-border outline-hidden focus-visible:bg-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-[orientation=horizontal]:h-px aria-[orientation=vertical]:w-px";
    const groups = suggestCnGroups(pool);
    expect(
      groups.some((chunk) => /\bbg-border\b/.test(chunk) && /\boutline-hidden\b/.test(chunk)),
    ).toBe(true);
  });
});

describe("areCnTailwindPartitionsEquivalent", () => {
  it("returns true for same partitions with different order", () => {
    expect(areCnTailwindPartitionsEquivalent(["b a", "d c"], ["a b", "c d"])).toBe(true);
  });

  it("returns false for different partitions", () => {
    expect(areCnTailwindPartitionsEquivalent(["a", "b c"], ["a b", "c"])).toBe(false);
  });
});

describe("mergeEaseTimingIntoFollowingAnimatedState", () => {
  it("merges ease-only chunk into later animated state chunk", () => {
    expect(
      mergeEaseTimingIntoFollowingAnimatedState([
        "ease-ui",
        "data-open:animate-in data-open:fade-in-0",
      ]),
    ).toEqual(["ease-ui data-open:animate-in data-open:fade-in-0"]);
  });

  it("skips intermediate state chunks to merge with later animate", () => {
    expect(
      mergeEaseTimingIntoFollowingAnimatedState([
        "base",
        "ease-ui",
        "sm:grid-rows-1 sm:p-4",
        "data-open:animate-in",
      ]),
    ).toEqual(["base", "sm:grid-rows-1 sm:p-4", "ease-ui data-open:animate-in"]);
  });
});

describe("mergeSingletons", () => {
  it("merges singleton into compatible forward neighbor", () => {
    expect(mergeSingletons(["bg-card", "text-white font-medium"])).toEqual([
      "bg-card text-white font-medium",
    ]);
  });
});

describe("capGroups", () => {
  it("caps with compatible adjacent merges only", () => {
    const groups = ["fixed inset-0", "grid", "overflow-auto", "hover:bg-accent", "focus:ring-2"];
    const out = capGroups(groups, 3);
    expect(out.length).toBeGreaterThanOrEqual(3);
    expect(out.join(" ")).toContain("fixed");
    expect(out.join(" ")).toContain("overflow-auto");
  });
});

describe("summarizeGroupBucketLabels", () => {
  it("returns bucket labels for single-bucket chunks", () => {
    expect(summarizeGroupBucketLabels(["flex gap-2", "text-sm"])).toEqual(["layout", "typography"]);
  });

  it("returns mixed labels for multi-bucket chunks", () => {
    const labels = summarizeGroupBucketLabels(["bg-card text-sm"]);
    expect(labels[0]).toBe("mixed:background+typography");
  });
});
