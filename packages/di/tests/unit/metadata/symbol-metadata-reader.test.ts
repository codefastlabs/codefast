import { describe, expect, it } from "vitest";
import {
  CODEFAST_DI_CONSTRUCTOR_METADATA,
  decoratorMetadataObjectSymbol,
} from "#/metadata/metadata-keys";
import type { ConstructorMetadata } from "#/metadata/metadata-types";
import { SymbolMetadataReader } from "#/metadata/symbol-metadata-reader";
import { token } from "#/token";
function setConstructorMetadata(implementationClass: object, key: symbol, payload: unknown) {
  Object.defineProperty(implementationClass, key, {
    value: payload,
    configurable: true,
    enumerable: false,
    writable: true,
  });
}
describe("SymbolMetadataReader", () => {
  it('reads constructor metadata from Symbol.for("Symbol.metadata") when global Symbol.metadata is missing', () => {
    const metadataKey = decoratorMetadataObjectSymbol();
    expect(typeof metadataKey).toBe("symbol");
    class Sample {
      constructor(readonly _: string) {}
    }
    const sampleToken = token<string>("Sample");
    const payload: ConstructorMetadata = {
      params: [{ index: 0, optional: false, token: sampleToken }],
    };
    const bucket: Record<string, unknown> = {
      [CODEFAST_DI_CONSTRUCTOR_METADATA]: payload,
    };
    setConstructorMetadata(Sample, metadataKey, bucket);
    const reader = new SymbolMetadataReader();
    expect(reader.getConstructorMetadata(Sample)).toBe(payload);
  });
  it("returns undefined if metadata object is missing", () => {
    class Sample {}
    const reader = new SymbolMetadataReader();
    expect(reader.getConstructorMetadata(Sample)).toBeUndefined();
  });
  it("returns undefined if metadata object is null or not an object", () => {
    const metadataKey = decoratorMetadataObjectSymbol();
    class Sample {}
    setConstructorMetadata(Sample, metadataKey, null);
    const reader = new SymbolMetadataReader();
    expect(reader.getConstructorMetadata(Sample)).toBeUndefined();
  });
  it("returns undefined if constructor metadata bucket is missing or invalid", () => {
    const metadataKey = decoratorMetadataObjectSymbol();
    class Sample {}
    setConstructorMetadata(Sample, metadataKey, {});
    const reader = new SymbolMetadataReader();
    expect(reader.getConstructorMetadata(Sample)).toBeUndefined();
    setConstructorMetadata(Sample, metadataKey, {
      [CODEFAST_DI_CONSTRUCTOR_METADATA]: { params: "not-an-array" },
    });
    expect(reader.getConstructorMetadata(Sample)).toBeUndefined();
    setConstructorMetadata(Sample, metadataKey, {
      [CODEFAST_DI_CONSTRUCTOR_METADATA]: "not-an-object",
    });
    expect(reader.getConstructorMetadata(Sample)).toBeUndefined();
  });
});
