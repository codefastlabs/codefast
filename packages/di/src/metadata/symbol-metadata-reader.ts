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
  constructorMetadataMap,
  lifecycleByConstructorMetadataMap,
  lifecycleMetadataMap,
} from "#/metadata/metadata-keys";

export class SymbolMetadataReader implements MetadataReader {
  getConstructorMetadata(target: Constructor): ConstructorMetadata | undefined {
    // WeakMap approach (works with esbuild/tsx)
    const fromWeakMap = constructorMetadataMap.get(target);
    if (fromWeakMap !== undefined) {
      return fromWeakMap;
    }

    // Symbol.metadata approach (works with SWC/vitest)
    const own = Object.getOwnPropertyDescriptor(target, Symbol.metadata);
    if (own === undefined) {
      return undefined;
    }
    const meta = own.value as Record<string | symbol, unknown> | null | undefined;
    if (!meta || typeof meta !== "object" || !Object.hasOwn(meta, INJECTABLE_KEY)) {
      return undefined;
    }
    return meta[INJECTABLE_KEY] as ConstructorMetadata;
  }

  getLifecycleMetadata(target: Constructor): LifecycleMetadata | undefined {
    const byConstructor = lifecycleByConstructorMetadataMap.get(target);
    if (byConstructor !== undefined) {
      return byConstructor;
    }

    // Try Symbol.metadata first (SWC)
    const own = Object.getOwnPropertyDescriptor(target, Symbol.metadata);
    if (own !== undefined) {
      const meta = own.value as Record<string | symbol, unknown> | null | undefined;
      if (meta && typeof meta === "object" && Object.hasOwn(meta, LIFECYCLE_KEY)) {
        return meta[LIFECYCLE_KEY] as LifecycleMetadata;
      }
    }

    // WeakMap approach: for methods, context.metadata is the class's Symbol.metadata object
    // When using esbuild, context.metadata for methods is a shared object per class
    // We need to find the metadata object associated with this class
    // Since method decorators share context.metadata with class, check via a parent metadata lookup
    // The lifecycle data was stored in lifecycleMetadataMap keyed by context.metadata
    // But we need to find the right metadata object for this class
    // For now: check if the class's own [Symbol.metadata] is in the lifecycleMetadataMap
    const classMeta = (target as { [Symbol.metadata]?: object })[Symbol.metadata];
    if (classMeta !== undefined) {
      const fromWeakMap = lifecycleMetadataMap.get(classMeta);
      if (fromWeakMap !== undefined) {
        return fromWeakMap;
      }
    }

    return undefined;
  }

  getAccessorMetadata(
    target: Constructor,
  ): Array<{ key: string | symbol; descriptor: InjectionDescriptor }> | undefined {
    const own = Object.getOwnPropertyDescriptor(target, Symbol.metadata);
    if (own === undefined) {
      return undefined;
    }
    const meta = own.value as Record<string | symbol, unknown> | null | undefined;
    if (!meta || typeof meta !== "object") {
      return undefined;
    }
    if (!Object.hasOwn(meta, INJECT_ACCESSOR_KEY)) {
      return undefined;
    }
    return meta[INJECT_ACCESSOR_KEY] as Array<{
      key: string | symbol;
      descriptor: InjectionDescriptor;
    }>;
  }
}

export const defaultMetadataReader = new SymbolMetadataReader();
