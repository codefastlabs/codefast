import {
  bucketsCompatible,
  bucketsMergeCompatible,
  classifyToken,
  indexOfFirstVariantColon,
  stateKey,
  stripVariants,
  tokenizeClassString,
} from "#lib/arrange";

describe("tokenizeClassString", () => {
  it("trims and splits on whitespace runs", () => {
    expect(tokenizeClassString("  flex  gap-2  ")).toEqual(["flex", "gap-2"]);
  });

  it("returns empty for whitespace-only input", () => {
    expect(tokenizeClassString(" \n\t ")).toEqual([]);
  });
});

describe("bucketsMergeCompatible", () => {
  it.each([
    ["state", "state", false],
    ["starting", "starting", false],
    ["layout", "sizing", true],
    ["shape", "shadow", true],
    ["layout", "state", false],
    ["arbitrary", "arbitrary", false],
    ["arbitrary", "state", false],
  ] as const)("merge compatibility %s + %s -> %s", (a, b, expected) => {
    expect(bucketsMergeCompatible(a, b)).toBe(expected);
    expect(bucketsMergeCompatible(b, a)).toBe(expected);
  });
});

describe("bucketsCompatible", () => {
  it.each([
    ["layout", "layout", true],
    ["layout", "sizing", true],
    ["shape", "shadow", true],
    ["layout", "state", false],
    ["arbitrary", "state", false],
  ] as const)("compatibility %s + %s -> %s", (a, b, expected) => {
    expect(bucketsCompatible(a, b)).toBe(expected);
    expect(bucketsCompatible(b, a)).toBe(expected);
  });
});

describe("stateKey", () => {
  it("uses the full variant stack for unique keys", () => {
    expect(stateKey("@md/field-group:[&>*]:w-auto")).not.toBe(
      stateKey("@md/field-group:[&>[data-slot=field-label]]:flex-auto"),
    );
  });

  it("normalizes bracketed data variant stems", () => {
    expect(stateKey("data-[state=open]:opacity-100")).toBe("data-[state=open]");
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

describe("indexOfFirstVariantColon + stripVariants", () => {
  it("ignores colons inside square brackets", () => {
    const tok = "[&_a:hover]:text-red-500";
    expect(indexOfFirstVariantColon(tok)).toBe("[&_a:hover]".length);
    expect(stripVariants(tok)).toBe("text-red-500");
  });

  it("strips stacked variant prefixes", () => {
    expect(stripVariants("@min-[600px]:@max-[900px]:hidden")).toBe("hidden");
  });
});

describe("classifyToken", () => {
  it.each([
    ["flex", "layout"],
    ["w-4", "sizing"],
    ["px-3", "spacing"],
    ["rounded-md", "shape"],
    ["text-sm", "typography"],
    ["transition", "motion"],
    ["outline-hidden", "shadow"],
    ["focus-visible:outline-hidden", "state"],
    ["hover:opacity-80", "state"],
    ["[&_svg]:size-4", "state"],
    ["starting:opacity-0", "starting"],
    ["cursor-default", "behavior"],
    ["@container/sidebar", "existence"],
    ["@md/sidebar:w-full", "state"],
  ] as const)("classifies %s -> %s", (token, bucket) => {
    expect(classifyToken(token)).toBe(bucket);
  });
});
