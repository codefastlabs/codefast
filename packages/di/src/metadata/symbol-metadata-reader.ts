import type { Constructor } from "#/binding";
import {
  CODEFAST_DI_CONSTRUCTOR_METADATA,
  CODEFAST_DI_LIFECYCLE_METADATA,
  decoratorMetadataObjectSymbol,
} from "#/metadata/metadata-keys";
import type {
  ConstructorMetadata,
  LifecycleMetadata,
  MetadataReader,
} from "#/metadata/metadata-types";
function isConstructorMetadata(value: unknown): value is ConstructorMetadata {
  if (typeof value !== "object" || value === null || !("params" in value)) {
    return false;
  }
  return Array.isArray((value as ConstructorMetadata).params);
}
export class SymbolMetadataReader implements MetadataReader {
  private readonly constructorMetadataCache = new WeakMap<
    Constructor<unknown>,
    ConstructorMetadata | null
  >();
  getConstructorMetadata(
    implementationClass: Constructor<unknown>,
  ): ConstructorMetadata | undefined {
    const cachedMetadata = this.constructorMetadataCache.get(implementationClass);
    if (cachedMetadata !== undefined) {
      return cachedMetadata === null ? undefined : cachedMetadata;
    }
    const metadataSymbol = decoratorMetadataObjectSymbol();
    const ownMetadataDescriptor = Object.getOwnPropertyDescriptor(
      implementationClass as unknown as object,
      metadataSymbol,
    );
    if (ownMetadataDescriptor === undefined) {
      this.constructorMetadataCache.set(implementationClass, null);
      return undefined;
    }
    const rawMetadata: unknown = ownMetadataDescriptor.value;
    if (typeof rawMetadata !== "object" || rawMetadata === null) {
      this.constructorMetadataCache.set(implementationClass, null);
      return undefined;
    }
    const metadataObject = rawMetadata;
    if (!Object.hasOwn(metadataObject, CODEFAST_DI_CONSTRUCTOR_METADATA)) {
      this.constructorMetadataCache.set(implementationClass, null);
      return undefined;
    }
    const raw: unknown = (metadataObject as Record<PropertyKey, unknown>)[
      CODEFAST_DI_CONSTRUCTOR_METADATA
    ];
    if (!isConstructorMetadata(raw)) {
      this.constructorMetadataCache.set(implementationClass, null);
      return undefined;
    }
    this.constructorMetadataCache.set(implementationClass, raw);
    return raw;
  }
  getLifecycleMetadata(implementationClass: Constructor<unknown>): LifecycleMetadata | undefined {
    const metadataSymbol = decoratorMetadataObjectSymbol();
    const metadataObject = (implementationClass as unknown as Record<symbol, unknown>)[
      metadataSymbol
    ];
    if (typeof metadataObject !== "object" || metadataObject === null) {
      return undefined;
    }
    const raw = (metadataObject as Record<PropertyKey, unknown>)[CODEFAST_DI_LIFECYCLE_METADATA];
    if (typeof raw !== "object" || raw === null) {
      return undefined;
    }
    return raw as LifecycleMetadata;
  }
}
