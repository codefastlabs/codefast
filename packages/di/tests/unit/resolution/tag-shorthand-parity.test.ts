/**
 * SPEC §3.5 makes `{ tag: pair }` and `{ tags: [pair] }` one request: same lane, same answer. These
 * pin both halves across every value kind `Object.is` and a `Map`'s SameValueZero can part on, so a
 * fast lane cannot serve one spelling and skip the other.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { singleTagOnlyOf } from "#/resolution/resolve-options";
import { token } from "#/token";
import type { BindingTag } from "#/types";

const TAG_KEY = "slot";

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

  container.bind(serviceToken).toConstantValue("hit").whenTagged(TAG_KEY, value);
  container.bind(serviceToken).toConstantValue("other").whenTagged(TAG_KEY, "other-slot");

  return { container, serviceToken };
}

describe("tag shorthand parity", () => {
  describe.each(TAG_VALUES)("%s tag value", (_label, value) => {
    it.each([
      ["matching", value],
      ["non-matching", "no-such-value"],
    ])("resolve agrees between tag and tags for a %s request", (_kind, requested) => {
      const { container, serviceToken } = containerWith(value);

      expect(outcomeOf(() => container.resolve(serviceToken, { tag: [TAG_KEY, requested] }))).toStrictEqual(
        outcomeOf(() => container.resolve(serviceToken, { tags: [[TAG_KEY, requested]] })),
      );
    });

    it("resolveOptional and resolveAll agree between tag and tags", () => {
      const { container, serviceToken } = containerWith(value);

      for (const requested of [value, "no-such-value"]) {
        expect(outcomeOf(() => container.resolveOptional(serviceToken, { tag: [TAG_KEY, requested] }))).toStrictEqual(
          outcomeOf(() => container.resolveOptional(serviceToken, { tags: [[TAG_KEY, requested]] })),
        );
        expect(outcomeOf(() => container.resolveAll(serviceToken, { tag: [TAG_KEY, requested] }))).toStrictEqual(
          outcomeOf(() => container.resolveAll(serviceToken, { tags: [[TAG_KEY, requested]] })),
        );
      }
    });
  });

  it("negative zero is refused by both forms where positive zero is bound", () => {
    const { container, serviceToken } = containerWith(0);

    // Not merely "the two agree": SameValueZero would have let the index answer this one.
    expect(container.resolveOptional(serviceToken, { tag: [TAG_KEY, -0] })).toBeUndefined();
    expect(container.resolveOptional(serviceToken, { tags: [[TAG_KEY, -0]] })).toBeUndefined();
    expect(container.resolveOptional(serviceToken, { tag: [TAG_KEY, 0] })).toBe("hit");
  });
});

describe("singleTagOnlyOf", () => {
  const pair: BindingTag = ["env", "prod"];

  it("admits both spellings of a one-tag request to the index lane", () => {
    expect(singleTagOnlyOf({ tag: pair })).toBe(pair);
    expect(singleTagOnlyOf({ tags: [pair] })).toBe(pair);
    expect(singleTagOnlyOf({ tag: pair, tags: [] })).toBe(pair);
  });

  it("withholds requests the single-tag index cannot answer", () => {
    // Two sources means two tags requested, and a one-tag index would skip the ambiguity check.
    expect(singleTagOnlyOf({ tag: pair, tags: [["tier", "premium"]] })).toBeUndefined();
    expect(singleTagOnlyOf({ tags: [pair, ["tier", "premium"]] })).toBeUndefined();
    expect(singleTagOnlyOf({ name: "primary", tag: pair })).toBeUndefined();
    expect(singleTagOnlyOf({})).toBeUndefined();
  });
});
