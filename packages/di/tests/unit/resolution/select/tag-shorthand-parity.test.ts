/**
 * `{ tag: pair }` and `{ tags: [pair] }` are one request: same lane, same answer. Since criteria are
 * interned the two carry the *same object*, so parity holds by construction — what still has teeth
 * is the intern cache itself, which must split `-0` from `0` and fold `NaN` onto one criterion,
 * because a `Map` key compares by SameValueZero and tag values answer to `Object.is`.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { slotName, tag } from "#/core/tag";
import { token } from "#/core/token";
import { inject } from "#/decorators/inject";
import { injectAll, normalizeToDescriptor, optional } from "#/injection/descriptor";
import { singleCriterionOnlyOf } from "#/injection/resolve-options";

const SLOT = tag("slot");
const ENV = tag("env");
const TIER = tag("tier");

/**
 * Value kinds worth pinning: `Object.is` and a `Map`'s SameValueZero part on `-0`, and `NaN` is the
 * pair they agree on. The rest cover the ordinary shapes a tag value takes.
 */
const TAG_VALUES: ReadonlyArray<readonly [label: string, value: unknown]> = [
  ["string", "prod"],
  ["zero", 0],
  ["negative zero", -0],
  ["NaN", Number.NaN],
  ["false", false],
  ["null", null],
  ["symbol", Symbol.for("di-test:tag-parity")],
  ["bigint", 10n],
];

/** The outcome of one call, with a throw folded into the same shape so the two forms compare. */
function outcomeOf(call: () => unknown): unknown {
  try {
    return { ok: call() };
  } catch (error) {
    return { error: (error as Error).constructor.name };
  }
}

function containerWith(value: unknown): { container: Container; serviceToken: ReturnType<typeof token<string>> } {
  const serviceToken = token<string>("tag-parity-service");
  const container = Container.create();

  container.bind(serviceToken).toConstantValue("hit").whenTagged(SLOT.of(value));
  container.bind(serviceToken).toConstantValue("other").whenTagged(SLOT.of("other-slot"));

  return { container, serviceToken };
}

describe("tag shorthand parity", () => {
  describe.each(TAG_VALUES)("%s tag value", (_label, value) => {
    it.each([
      ["matching", value],
      ["non-matching", "no-such-value"],
    ])("resolve agrees between tag and tags for a %s request", (_kind, requested) => {
      const { container, serviceToken } = containerWith(value);

      expect(outcomeOf(() => container.resolve(serviceToken, { tag: SLOT.of(requested) }))).toStrictEqual(
        outcomeOf(() => container.resolve(serviceToken, { tags: [SLOT.of(requested)] })),
      );
    });

    it("resolveOptional and resolveAll agree between tag and tags", () => {
      const { container, serviceToken } = containerWith(value);

      for (const requested of [value, "no-such-value"]) {
        expect(outcomeOf(() => container.resolveOptional(serviceToken, { tag: SLOT.of(requested) }))).toStrictEqual(
          outcomeOf(() => container.resolveOptional(serviceToken, { tags: [SLOT.of(requested)] })),
        );
        expect(outcomeOf(() => container.resolveAll(serviceToken, { tag: SLOT.of(requested) }))).toStrictEqual(
          outcomeOf(() => container.resolveAll(serviceToken, { tags: [SLOT.of(requested)] })),
        );
      }
    });
  });

  it("interns one criterion per value, splitting -0 from 0 and folding NaN", () => {
    expect(SLOT.of("prod")).toBe(SLOT.of("prod"));
    expect(SLOT.of(0)).not.toBe(SLOT.of(-0));
    expect(SLOT.of(Number.NaN)).toBe(SLOT.of(Number.NaN));
    expect(SLOT.of(0)).not.toBe(ENV.of(0));
  });

  it("negative zero is refused by both forms where positive zero is bound", () => {
    const { container, serviceToken } = containerWith(0);

    // Not merely "the two agree": SameValueZero would have let the index answer this one.
    expect(container.resolveOptional(serviceToken, { tag: SLOT.of(-0) })).toBeUndefined();
    expect(container.resolveOptional(serviceToken, { tags: [SLOT.of(-0)] })).toBeUndefined();
    expect(container.resolveOptional(serviceToken, { tag: SLOT.of(0) })).toBe("hit");
  });
});

describe("tag shorthand on the injection surface", () => {
  const pair = ENV.of("prod");

  it.each([
    ["inject", inject],
    ["optional", optional],
    ["injectAll", injectAll],
  ])("%s builds the same descriptor from either spelling", (_label, build) => {
    const dependency = token<string>("inject-parity-dep");

    expect(normalizeToDescriptor(build(dependency, { tag: pair }))).toStrictEqual(
      normalizeToDescriptor(build(dependency, { tags: [pair] })),
    );
  });

  it("folds the shorthand into tags rather than carrying a second spelling", () => {
    const dependency = token<string>("inject-fold-dep");
    const listed = TIER.of("premium");

    const shorthandOnly = normalizeToDescriptor(inject(dependency, { tag: pair }));
    expect(shorthandOnly.tags).toStrictEqual([pair]);
    expect("tag" in shorthandOnly).toBe(false);

    // Both given is a request for every pair across the two.
    expect(normalizeToDescriptor(inject(dependency, { tag: pair, tags: [listed] })).tags).toStrictEqual([pair, listed]);
  });

  it("selects the same binding through a factory dependency either way", () => {
    const dependency = token<string>("inject-resolve-dep");

    for (const options of [{ tag: pair }, { tags: [pair] }] as const) {
      const container = Container.create();
      container.bind(dependency).toConstantValue("hit").whenTagged(pair);
      container.bind(dependency).toConstantValue("other").whenTagged(ENV.of("dev"));

      const consumer = token<string>("inject-resolve-consumer");
      container.bind(consumer).toResolved((value: string) => value, [inject(dependency, options)]);

      expect(container.resolve(consumer)).toBe("hit");
    }
  });
});

describe("singleCriterionOnlyOf", () => {
  const pair = ENV.of("prod");

  it("admits both spellings of a one-tag request to the index lane", () => {
    expect(singleCriterionOnlyOf({ tag: pair })).toBe(pair);
    expect(singleCriterionOnlyOf({ tags: [pair] })).toBe(pair);
    expect(singleCriterionOnlyOf({ tag: pair, tags: [] })).toBe(pair);
  });

  it("folds a lone name to the reserved criterion once one is minted", () => {
    // The fold peeks rather than mints, so an undeclared name folds to nothing.
    expect(singleCriterionOnlyOf({ name: "parity-unminted" })).toBeUndefined();
    const criterion = slotName.of("primary");
    expect(singleCriterionOnlyOf({ name: "primary" })).toBe(criterion);
    expect(singleCriterionOnlyOf({ name: "primary", tags: [] })).toBe(criterion);
  });

  it("never interns a request-side name no binding declared", () => {
    const container = Container.create();
    const probe = token<string>("parity-leak-probe-target");
    container.bind(probe).toConstantValue("v").whenNamed("declared");

    expect(container.resolveOptional(probe, { name: "never-declared-name" })).toBeUndefined();
    // The miss folded through peek, so the name minted nothing.
    expect(slotName.peek("never-declared-name")).toBeUndefined();
    expect(slotName.peek("declared")).toBeDefined();
  });

  it("renders the reserved criterion as name in NoMatchingBindingError", () => {
    const container = Container.create();
    const probe = token<string>("parity-error-probe");
    container.bind(probe).toConstantValue("v").whenNamed("x");

    expect(() => container.resolve(probe, { tag: slotName.of("y") })).toThrow(/"name":"y"/);
  });

  it("withholds requests the single-criterion index cannot answer", () => {
    // Two sources means two criteria requested, and a one-criterion index would skip the ambiguity check.
    expect(singleCriterionOnlyOf({ tag: pair, tags: [TIER.of("premium")] })).toBeUndefined();
    expect(singleCriterionOnlyOf({ tags: [pair, TIER.of("premium")] })).toBeUndefined();
    expect(singleCriterionOnlyOf({ name: "primary", tag: pair })).toBeUndefined();
    expect(singleCriterionOnlyOf({ name: "primary", tags: [pair] })).toBeUndefined();
    expect(singleCriterionOnlyOf({})).toBeUndefined();
  });
});
