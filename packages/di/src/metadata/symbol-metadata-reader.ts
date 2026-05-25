import type { Constructor } from "#/types";
import type {
  ConstructorMetadata,
  LifecycleMetadata,
  MetadataReader,
} from "#/metadata/metadata-types";
import type { InjectionDescriptor } from "#/decorators/inject";
import {
  INJECT_ACCESSOR_KEY,
  INJECTABLE_KEY,
  LIFECYCLE_KEY,
  METADATA_SYMBOL,
} from "#/metadata/metadata-keys";

/**
 * @since 0.3.16-canary.0
 */
export class SymbolMetadataReader implements MetadataReader {
  getConstructorMetadata(target: Constructor): ConstructorMetadata | undefined {
    const metadataDescriptor = Object.getOwnPropertyDescriptor(target, METADATA_SYMBOL);
    if (metadataDescriptor === undefined) {
      return undefined;
    }
    const metadataRecord = metadataDescriptor.value as
      | Record<string | symbol, unknown>
      | null
      | undefined;
    if (
      !metadataRecord ||
      typeof metadataRecord !== "object" ||
      !Object.hasOwn(metadataRecord, INJECTABLE_KEY)
    ) {
      return undefined;
    }
    return metadataRecord[INJECTABLE_KEY] as ConstructorMetadata;
  }

  getLifecycleMetadata(target: Constructor): LifecycleMetadata | undefined {
    const metadataDescriptor = Object.getOwnPropertyDescriptor(target, METADATA_SYMBOL);
    if (metadataDescriptor === undefined) {
      return undefined;
    }
    const metadataRecord = metadataDescriptor.value as
      | Record<string | symbol, unknown>
      | null
      | undefined;
    if (
      !metadataRecord ||
      typeof metadataRecord !== "object" ||
      !Object.hasOwn(metadataRecord, LIFECYCLE_KEY)
    ) {
      return undefined;
    }
    return metadataRecord[LIFECYCLE_KEY] as LifecycleMetadata;
  }

  getAccessorMetadata(
    target: Constructor,
  ): Array<{ key: string | symbol; descriptor: InjectionDescriptor }> | undefined {
    const metadataDescriptor = Object.getOwnPropertyDescriptor(target, METADATA_SYMBOL);
    if (metadataDescriptor === undefined) {
      return undefined;
    }
    const metadataRecord = metadataDescriptor.value as
      | Record<string | symbol, unknown>
      | null
      | undefined;
    if (
      !metadataRecord ||
      typeof metadataRecord !== "object" ||
      !Object.hasOwn(metadataRecord, INJECT_ACCESSOR_KEY)
    ) {
      return undefined;
    }
    return metadataRecord[INJECT_ACCESSOR_KEY] as Array<{
      key: string | symbol;
      descriptor: InjectionDescriptor;
    }>;
  }
}

/**
 * @since 0.3.16-canary.0
 */
export const defaultMetadataReader = new SymbolMetadataReader();
