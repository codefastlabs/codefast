import { DiError, InternalError } from "#/errors";
import type { InjectOptions } from "#/decorators/inject";
import { inject, injectAll, optional, isInjectionDescriptor } from "#/decorators/inject";
import { token } from "#/token";
describe("inject", () => {
  it("preserves string keys in tag resolve hints", () => {
    const numericToken = token<number>("inject-test-token");
    const descriptor = inject(numericToken, { tag: ["inject-test-tag", "payload"] });
    expect(descriptor.tag).toEqual(["inject-test-tag", "payload"]);
  });
  it("throws when tag key is not a string", () => {
    const numericToken = token<number>("inject-test-bad-tag");
    expect(() =>
      inject(numericToken, {
        tag: [1, 2],
      } as unknown as InjectOptions),
    ).toThrow(DiError);
  });
  it("inject handles named options", () => {
    const plainToken = token("inject-named-options-token");
    const desc = inject(plainToken, { name: "custom" });
    expect(desc.name).toBe("custom");
  });
  it("optional creates a descriptor with optional: true", () => {
    const plainToken = token("inject-optional-token");
    const desc = optional(plainToken);
    expect(desc.token).toBe(plainToken);
    expect(desc.optional).toBe(true);
  });
  it("injectAll sets isInjectAllBindings and forwards name/tag options", () => {
    const stringToken = token<string>("inject-all-t");
    const plain = injectAll(stringToken);
    expect(plain.isInjectAllBindings).toBe(true);
    expect(plain.optional).toBe(false);
    const named = injectAll(stringToken, { name: "x" });
    expect(named.isInjectAllBindings).toBe(true);
    expect(named.name).toBe("x");
  });
  it("isInjectionDescriptor validates descriptors", () => {
    expect(isInjectionDescriptor({ token: "T", optional: false })).toBe(true);
    expect(isInjectionDescriptor({ token: "T", optional: true })).toBe(true);
    expect(isInjectionDescriptor({})).toBe(false);
    expect(isInjectionDescriptor(null)).toBe(false);
  });
  it("throws InternalError when used with a non-accessor decorator context", () => {
    const plainToken = token("inject-bad-decorator-context");
    const fieldLikeContext = { kind: "field", name: "x", metadata: {} } as const;
    expect(() => inject(plainToken, fieldLikeContext as never)).toThrow(InternalError);
  });
  it("normalizeTag throws on invalid tag format", () => {
    const plainToken = token("inject-normalize-tag-token");
    expect(() => inject(plainToken, { tag: "not-an-array" } as unknown as InjectOptions)).toThrow(
      DiError,
    );
    expect(() => inject(plainToken, { tag: ["only-one"] } as unknown as InjectOptions)).toThrow(
      /must be a tuple/,
    );
  });
});
