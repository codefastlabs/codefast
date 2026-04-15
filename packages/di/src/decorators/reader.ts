import type { Constructor } from "#lib/binding";
import {
  CODEFAST_DI_CONSTRUCTOR_METADATA,
  decoratorMetadataObjectSymbol,
  type ConstructorMetadata,
  type MetadataReader,
} from "#lib/decorators/metadata";

function isConstructorMetadata(value: unknown): value is ConstructorMetadata {
  if (typeof value !== "object" || value === null || !("parameters" in value)) {
    return false;
  }
  return Array.isArray((value as ConstructorMetadata).parameters);
}

/**
 * Reads {@link ConstructorMetadata} from the standard `Symbol.metadata` object.
 */
export class SymbolMetadataReader implements MetadataReader {
  getConstructorMetadata(ctor: Constructor<unknown>): ConstructorMetadata | undefined {
    const metadataObjectKey = decoratorMetadataObjectSymbol();
    const bucketUnknown: unknown = (ctor as unknown as Record<symbol, unknown>)[metadataObjectKey];
    if (typeof bucketUnknown !== "object" || bucketUnknown === null) {
      return undefined;
    }
    const bucket = bucketUnknown;
    const raw: unknown = (bucket as Record<PropertyKey, unknown>)[CODEFAST_DI_CONSTRUCTOR_METADATA];
    if (!isConstructorMetadata(raw)) {
      return undefined;
    }
    return raw;
  }
}
