import type { InjectionDescriptor } from "#/decorators/inject";
import { INJECT_ACCESSOR_KEY, INJECTABLE_KEY, LIFECYCLE_KEY, METADATA_SYMBOL } from "#/metadata/metadata-keys";
import type { ConstructorMetadata, LifecycleMetadata, MetadataReader } from "#/metadata/metadata-types";
import type { Constructor } from "#/types";

/**
 * @since 0.3.16-canary.0
 */
export class SymbolMetadataReader implements MetadataReader {
  private _getMetadataRecord(target: Constructor, key: string | symbol): Record<string | symbol, unknown> | undefined {
    const descriptor = Object.getOwnPropertyDescriptor(target, METADATA_SYMBOL);
    if (descriptor === undefined) {
      return undefined;
    }
    const record = descriptor.value as Record<string | symbol, unknown> | null | undefined;
    if (!record || typeof record !== "object" || !Object.hasOwn(record, key)) {
      return undefined;
    }
    return record;
  }

  getConstructorMetadata(target: Constructor): ConstructorMetadata | undefined {
    const record = this._getMetadataRecord(target, INJECTABLE_KEY);
    return record?.[INJECTABLE_KEY] as ConstructorMetadata | undefined;
  }

  getLifecycleMetadata(target: Constructor): LifecycleMetadata | undefined {
    const record = this._getMetadataRecord(target, LIFECYCLE_KEY);
    return record?.[LIFECYCLE_KEY] as LifecycleMetadata | undefined;
  }

  getAccessorMetadata(
    target: Constructor,
  ): Array<{ key: string | symbol; descriptor: InjectionDescriptor }> | undefined {
    const record = this._getMetadataRecord(target, INJECT_ACCESSOR_KEY);
    return record?.[INJECT_ACCESSOR_KEY] as
      | Array<{ key: string | symbol; descriptor: InjectionDescriptor }>
      | undefined;
  }
}

/**
 * @since 0.3.16-canary.0
 */
export const defaultMetadataReader = new SymbolMetadataReader();
