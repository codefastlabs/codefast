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
  accessorMetadataByConstructorMap,
  accessorMetadataByMetadataObjectMap,
  constructorMetadataMap,
  lifecycleByConstructorMetadataMap,
  lifecycleMetadataMap,
} from "#/metadata/metadata-keys";

/**
 * @since 0.3.16-canary.0
 */
export class SymbolMetadataReader implements MetadataReader {
  getConstructorMetadata(target: Constructor): ConstructorMetadata | undefined {
    // WeakMap approach (works with esbuild/tsx)
    const weakMapMetadata = constructorMetadataMap.get(target);
    if (weakMapMetadata !== undefined) {
      return weakMapMetadata;
    }

    // Symbol.metadata approach (works with SWC/vitest)
    const metadataDescriptor = Object.getOwnPropertyDescriptor(target, Symbol.metadata);
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
    const lifecycleMetadataByConstructor = lifecycleByConstructorMetadataMap.get(target);
    if (lifecycleMetadataByConstructor !== undefined) {
      return lifecycleMetadataByConstructor;
    }

    // Try Symbol.metadata first (SWC)
    const metadataDescriptor = Object.getOwnPropertyDescriptor(target, Symbol.metadata);
    if (metadataDescriptor !== undefined) {
      const metadataRecord = metadataDescriptor.value as
        | Record<string | symbol, unknown>
        | null
        | undefined;
      if (
        metadataRecord &&
        typeof metadataRecord === "object" &&
        Object.hasOwn(metadataRecord, LIFECYCLE_KEY)
      ) {
        return metadataRecord[LIFECYCLE_KEY] as LifecycleMetadata;
      }
    }

    // WeakMap approach: for methods, context.metadata is the class's Symbol.metadata object
    // When using esbuild, context.metadata for methods is a shared object per class
    // We need to find the metadata object associated with this class
    // Since method decorators share context.metadata with class, check via a parent metadata lookup
    // The lifecycle data was stored in lifecycleMetadataMap keyed by context.metadata
    // But we need to find the right metadata object for this class
    // For now: check if the class's own [Symbol.metadata] is in the lifecycleMetadataMap
    const classMetadataObject = (target as { [Symbol.metadata]?: object })[Symbol.metadata];
    if (classMetadataObject !== undefined) {
      const weakMapMetadata = lifecycleMetadataMap.get(classMetadataObject);
      if (weakMapMetadata !== undefined) {
        return weakMapMetadata;
      }
    }

    return undefined;
  }

  getAccessorMetadata(
    target: Constructor,
  ): Array<{ key: string | symbol; descriptor: InjectionDescriptor }> | undefined {
    const byConstructor = accessorMetadataByConstructorMap.get(target);
    if (byConstructor !== undefined) {
      return byConstructor as Array<{ key: string | symbol; descriptor: InjectionDescriptor }>;
    }

    const metadataObject = (target as { [Symbol.metadata]?: object })[Symbol.metadata];
    if (metadataObject !== undefined) {
      const fromWeakMap = accessorMetadataByMetadataObjectMap.get(metadataObject);
      if (fromWeakMap !== undefined) {
        return fromWeakMap as Array<{ key: string | symbol; descriptor: InjectionDescriptor }>;
      }
    }

    const metadataDescriptor = Object.getOwnPropertyDescriptor(target, Symbol.metadata);
    if (metadataDescriptor === undefined) {
      return undefined;
    }
    const metadataRecord = metadataDescriptor.value as
      | Record<string | symbol, unknown>
      | null
      | undefined;
    if (!metadataRecord || typeof metadataRecord !== "object") {
      return undefined;
    }
    if (!Object.hasOwn(metadataRecord, INJECT_ACCESSOR_KEY)) {
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
