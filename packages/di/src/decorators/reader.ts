import type { Constructor } from "#/binding";
import {
  CODEFAST_DI_CONSTRUCTOR_METADATA,
  CODEFAST_DI_LIFECYCLE_METADATA,
  decoratorMetadataObjectSymbol,
  type ConstructorMetadata,
  type LifecycleMetadata,
  type MetadataReader,
} from "#/decorators/metadata";

function isConstructorMetadata(value: unknown): value is ConstructorMetadata {
  if (typeof value !== "object" || value === null || !("params" in value)) {
    return false;
  }
  return Array.isArray((value as ConstructorMetadata).params);
}

/**
 * Reads {@link ConstructorMetadata} from the standard `Symbol.metadata` object.
 */
export class SymbolMetadataReader implements MetadataReader {
  getConstructorMetadata(ctor: Constructor<unknown>): ConstructorMetadata | undefined {
    const metadataSymbol = decoratorMetadataObjectSymbol();
    const rawMetadata: unknown = (ctor as unknown as Record<symbol, unknown>)[metadataSymbol];
    if (typeof rawMetadata !== "object" || rawMetadata === null) {
      return undefined;
    }
    const metadataObject = rawMetadata;
    // CRITICAL: Use Object.hasOwn to prevent reading inherited metadata from parent classes.
    // TC39 Symbol.metadata prototype-chains from parent → child. Without this guard,
    // a subclass without @injectable() would silently inherit parent metadata, causing
    // wrong dep count injection with no compile-time error.
    if (!Object.hasOwn(metadataObject, CODEFAST_DI_CONSTRUCTOR_METADATA)) {
      return undefined;
    }
    const raw: unknown = (metadataObject as Record<PropertyKey, unknown>)[
      CODEFAST_DI_CONSTRUCTOR_METADATA
    ];
    if (!isConstructorMetadata(raw)) {
      return undefined;
    }
    return raw;
  }

  getLifecycleMetadata(ctor: Constructor<unknown>): LifecycleMetadata | undefined {
    const metadataSymbol = decoratorMetadataObjectSymbol();
    const metadataObject = (ctor as unknown as Record<symbol, unknown>)[metadataSymbol];
    if (typeof metadataObject !== "object" || metadataObject === null) {
      return undefined;
    }
    // Lifecycle metadata CAN be inherited (postConstruct on parent is valid for child)
    const raw = (metadataObject as Record<PropertyKey, unknown>)[CODEFAST_DI_LIFECYCLE_METADATA];
    if (typeof raw !== "object" || raw === null) {
      return undefined;
    }
    return raw as LifecycleMetadata;
  }
}
