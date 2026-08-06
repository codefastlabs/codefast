import { expectTypeOf } from "expect-type";
import { describe, expect, it } from "vitest";

import { DEFAULT_BINDING_SLOT } from "#/core/binding";
import type { BindingTag, ResolveOptions } from "#/core/types";
import type { InjectableOptions } from "#/decorators/injectable";
import type { InjectOptions } from "#/injection/descriptor";
import { injectionSlotToResolveOptions, bindingSlotToResolveOptions } from "#/injection/resolve-options";
import type { GraphOptions } from "#/introspection/dependency-graph";

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

describe("the public option bags accept an explicit undefined", () => {
  // `exactOptionalPropertyTypes` is on, so `name?: string` would reject a caller holding
  // `string | undefined` — the shape every real call site actually has.
  it("takes a possibly-undefined name, tag and tags without a cast", () => {
    const maybeName: string | undefined = undefined;
    const maybeTag: BindingTag | undefined = undefined;
    const maybeTags: ReadonlyArray<BindingTag> | undefined = undefined;

    const resolveOptions: ResolveOptions = { name: maybeName, tag: maybeTag, tags: maybeTags };
    const injectOptions: InjectOptions = { name: maybeName, tag: maybeTag, tags: maybeTags };
    const graphOptions: GraphOptions = { includeParent: undefined };
    const injectableOptions: InjectableOptions = { autoRegister: undefined, scope: undefined };

    expectTypeOf(resolveOptions).toExtend<ResolveOptions>();
    expectTypeOf(injectOptions).toExtend<InjectOptions>();
    expectTypeOf(graphOptions).toExtend<GraphOptions>();
    expectTypeOf(injectableOptions).toExtend<InjectableOptions>();
    expect(resolveOptions.name).toBeUndefined();
  });
});
