import { expectTypeOf } from "expect-type";
import { describe, expect, it } from "vitest";
import { DEFAULT_SLOT } from "#/binding";
import { injectableSlotToResolveOptions, slotKeyToResolveOptions } from "#/resolve-options";
import type { ResolveOptions } from "#/types";

describe("ResolveOptions helpers (EOPT-friendly)", () => {
  it("slotKeyToResolveOptions returns undefined for default slot", () => {
    const empty = slotKeyToResolveOptions(DEFAULT_SLOT);
    expectTypeOf(empty).toEqualTypeOf<ResolveOptions | undefined>();
    expect(empty).toBeUndefined();
  });

  it("slotKeyToResolveOptions includes name when set", () => {
    const options = slotKeyToResolveOptions({ name: "primary", tags: [] });
    expectTypeOf(options).toEqualTypeOf<ResolveOptions | undefined>();
    expect(options).toEqual({ name: "primary" });
  });

  it("injectableSlotToResolveOptions returns undefined for empty slot", () => {
    const empty = injectableSlotToResolveOptions({});
    expectTypeOf(empty).toEqualTypeOf<ResolveOptions | undefined>();
    expect(empty).toBeUndefined();
  });

  it("injectableSlotToResolveOptions carries name when provided", () => {
    const withName = injectableSlotToResolveOptions({ name: "n" });
    expectTypeOf(withName).toEqualTypeOf<ResolveOptions | undefined>();
    expect(withName).toEqual({ name: "n" });
  });
});
