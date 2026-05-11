import { expectTypeOf } from "expect-type";
import { describe, expect, it } from "vitest";
import { DEFAULT_BINDING_SLOT } from "#/binding";
import { injectionSlotToResolveOptions, bindingSlotToResolveOptions } from "#/resolve-options";
import type { ResolveOptions } from "#/types";

describe("ResolveOptions helpers (EOPT-friendly)", () => {
  it("bindingSlotToResolveOptions returns undefined for default slot", () => {
    const defaultSlotOptions = bindingSlotToResolveOptions(DEFAULT_BINDING_SLOT);
    expectTypeOf(defaultSlotOptions).toEqualTypeOf<ResolveOptions | undefined>();
    expect(defaultSlotOptions).toBeUndefined();
  });

  it("bindingSlotToResolveOptions includes name when set", () => {
    const namedSlotOptions = bindingSlotToResolveOptions({ name: "primary", tags: [] });
    expectTypeOf(namedSlotOptions).toEqualTypeOf<ResolveOptions | undefined>();
    expect(namedSlotOptions).toEqual({ name: "primary" });
  });

  it("injectionSlotToResolveOptions returns undefined for empty slot", () => {
    const emptyInjectionOptions = injectionSlotToResolveOptions({});
    expectTypeOf(emptyInjectionOptions).toEqualTypeOf<ResolveOptions | undefined>();
    expect(emptyInjectionOptions).toBeUndefined();
  });

  it("injectionSlotToResolveOptions carries name when provided", () => {
    const namedInjectionOptions = injectionSlotToResolveOptions({ name: "n" });
    expectTypeOf(namedInjectionOptions).toEqualTypeOf<ResolveOptions | undefined>();
    expect(namedInjectionOptions).toEqual({ name: "n" });
  });
});
