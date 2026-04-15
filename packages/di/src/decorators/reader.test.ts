import { describe, expect, it } from "vitest";
import {
  CODEFAST_DI_CONSTRUCTOR_METADATA,
  decoratorMetadataObjectSymbol,
  type ConstructorMetadata,
} from "#lib/decorators/metadata";
import { SymbolMetadataReader } from "#lib/decorators/reader";
import { token } from "#lib/token";

describe("SymbolMetadataReader", () => {
  it('reads constructor metadata from Symbol.for("Symbol.metadata") when global Symbol.metadata is missing', () => {
    const metadataKey = decoratorMetadataObjectSymbol();
    expect(typeof metadataKey).toBe("symbol");

    class Sample {
      constructor(readonly _: string) {}
    }

    const sampleToken = token<string>("Sample");
    const payload: ConstructorMetadata = {
      parameters: [{ optional: false, token: sampleToken }],
    };

    const bucket: Record<string, unknown> = {
      [CODEFAST_DI_CONSTRUCTOR_METADATA]: payload,
    };

    Object.defineProperty(Sample, metadataKey, {
      value: bucket,
      configurable: true,
      enumerable: false,
      writable: true,
    });

    const reader = new SymbolMetadataReader();
    expect(reader.getConstructorMetadata(Sample)).toBe(payload);
  });
});
