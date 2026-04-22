import { describe, expect, it } from "vitest";
import {
  CODEFAST_DI_CONSTRUCTOR_METADATA,
  CODEFAST_DI_LIFECYCLE_METADATA,
  decoratorMetadataObjectSymbol,
} from "#/metadata/metadata-keys";
import type { ConstructorMetadata, LifecycleMetadata } from "#/metadata/metadata-types";
import { SymbolMetadataReader } from "#/metadata/symbol-metadata-reader";
import { token } from "#/token";

describe("SymbolMetadataReader branch coverage (observable behavior)", () => {
  const reader = new SymbolMetadataReader();
  const sym = decoratorMetadataObjectSymbol();

  // covers: symbol-metadata-reader.ts:52-54 — no own Symbol.metadata bag on the constructor
  it("returns undefined for constructor metadata when the class has no own metadata descriptor", () => {
    class Plain {}
    expect(reader.getConstructorMetadata(Plain as never)).toBeUndefined();
  });

  // covers: symbol-metadata-reader.ts:55-57 — own descriptor present but value is null
  it("returns undefined when own Symbol.metadata value is null", () => {
    class WithNullBag {}
    Object.defineProperty(WithNullBag, sym, {
      value: null,
      configurable: true,
      enumerable: false,
    });
    expect(reader.getConstructorMetadata(WithNullBag as never)).toBeUndefined();
  });

  // covers: symbol-metadata-reader.ts:64-65 — own bag exists but constructor bucket is not an own property
  it("returns undefined when metadata bag lacks an own constructor-metadata entry", () => {
    class EmptyBag {}
    Object.defineProperty(EmptyBag, sym, {
      value: {},
      configurable: true,
      enumerable: false,
    });
    expect(reader.getConstructorMetadata(EmptyBag as never)).toBeUndefined();
  });

  // covers: symbol-metadata-reader.ts:70-71 — constructor bucket fails structural validation
  it("returns undefined when constructor metadata is not a valid ConstructorMetadata object", () => {
    class BadShape {}
    Object.defineProperty(BadShape, sym, {
      value: { [CODEFAST_DI_CONSTRUCTOR_METADATA]: { params: "not-array" } },
      configurable: true,
      enumerable: false,
    });
    expect(reader.getConstructorMetadata(BadShape as never)).toBeUndefined();
  });

  // covers: symbol-metadata-reader.ts:16-19 — isConstructorMetadata rejects objects without a params field
  it("returns undefined when constructor bucket is an object missing params", () => {
    class MissingParams {}
    Object.defineProperty(MissingParams, sym, {
      value: { [CODEFAST_DI_CONSTRUCTOR_METADATA]: { notParams: [] } },
      configurable: true,
      enumerable: false,
    });
    expect(reader.getConstructorMetadata(MissingParams as never)).toBeUndefined();
  });

  // covers: symbol-metadata-reader.ts:84-85 — lifecycle read when Symbol.metadata is missing or non-object
  it("getLifecycleMetadata returns undefined when no metadata object is reachable", () => {
    class NoMeta {}
    expect(reader.getLifecycleMetadata(NoMeta as never)).toBeUndefined();
  });

  // covers: symbol-metadata-reader.ts:84-85 — lifecycle read when Symbol.metadata is a non-object primitive
  it("getLifecycleMetadata returns undefined when Symbol.metadata is a string primitive", () => {
    class StringMeta {}
    Object.defineProperty(StringMeta, sym, {
      value: "not-an-object",
      configurable: true,
      enumerable: false,
    });
    expect(reader.getLifecycleMetadata(StringMeta as never)).toBeUndefined();
  });

  // covers: symbol-metadata-reader.ts:88-90 — lifecycle bucket missing or not an object
  it("getLifecycleMetadata returns undefined when lifecycle key is absent or null", () => {
    class NoLifecycle {}
    Object.defineProperty(NoLifecycle, sym, {
      value: { [CODEFAST_DI_CONSTRUCTOR_METADATA]: { params: [] } },
      configurable: true,
      enumerable: false,
    });
    expect(reader.getLifecycleMetadata(NoLifecycle as never)).toBeUndefined();

    class NullLifecycle {}
    Object.defineProperty(NullLifecycle, sym, {
      value: { [CODEFAST_DI_LIFECYCLE_METADATA]: null },
      configurable: true,
      enumerable: false,
    });
    expect(reader.getLifecycleMetadata(NullLifecycle as never)).toBeUndefined();
  });

  // covers: symbol-metadata-reader.ts:79-92 — successful lifecycle metadata read from Symbol.metadata
  it("getLifecycleMetadata returns lifecycle object written on the class metadata bag", () => {
    const sampleToken = token<string>("meta-reader-life");
    const ctorMeta: ConstructorMetadata = {
      params: [{ index: 0, optional: false, token: sampleToken }],
    };
    const life: LifecycleMetadata = { postConstruct: "warmUp" };
    class WithLife {}
    Object.defineProperty(WithLife, sym, {
      value: {
        [CODEFAST_DI_CONSTRUCTOR_METADATA]: ctorMeta,
        [CODEFAST_DI_LIFECYCLE_METADATA]: life,
      },
      configurable: true,
      enumerable: false,
    });
    expect(reader.getLifecycleMetadata(WithLife as never)).toEqual(life);
  });
});
