import { DiError } from "#/errors";
import { token } from "#/token";
import { inject, optional, isInjectionDescriptor } from "#/decorators/inject";

describe("inject", () => {
  it("preserves string keys in tag resolve hints", () => {
    const T = token<number>("inject-test-token");
    const descriptor = inject(T, { tag: ["inject-test-tag", "payload"] });

    expect(descriptor.tag).toEqual(["inject-test-tag", "payload"]);
  });

  it("throws when tag key is not a string", () => {
    const T = token<number>("inject-test-bad-tag");
    expect(() =>
      inject(T, {
        // @ts-expect-error — exercise runtime validation for non-string tag keys
        tag: [1, 2],
      }),
    ).toThrow(DiError);
  });

  it("inject handles named options", () => {
    const t = token("T");
    const desc = inject(t, { name: "custom" });
    expect(desc.name).toBe("custom");
  });

  it("optional creates a descriptor with optional: true", () => {
    const t = token("T");
    const desc = optional(t);
    expect(desc.token).toBe(t);
    expect(desc.optional).toBe(true);
  });

  it("isInjectionDescriptor validates descriptors", () => {
    expect(isInjectionDescriptor({ token: "T", optional: false })).toBe(true);
    expect(isInjectionDescriptor({ token: "T", optional: true })).toBe(true);
    expect(isInjectionDescriptor({})).toBe(false);
    expect(isInjectionDescriptor(null)).toBe(false);
  });

  it("normalizeTag throws on invalid tag format", () => {
    const t = token("T");
    // @ts-expect-error - testing invalid runtime input
    expect(() => inject(t, { tag: "not-an-array" })).toThrow(DiError);
    // @ts-expect-error - testing invalid runtime input
    expect(() => inject(t, { tag: ["only-one"] })).toThrow(/must be a tuple/);
  });
});
