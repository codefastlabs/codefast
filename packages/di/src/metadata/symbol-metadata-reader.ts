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
    // Primary path: WeakMap keyed by constructor, written explicitly by @injectable().
    // Always populated regardless of whether Symbol.metadata is native or a Symbol.for() fallback.
    const weakMapMetadata = constructorMetadataMap.get(target);
    if (weakMapMetadata !== undefined) {
      return weakMapMetadata;
    }

    // Secondary path: read from native Symbol.metadata when the decorator runtime wired
    // context.metadata into it (e.g. TypeScript native Stage 3 emit, or Node 22+ native decorators).
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

    // Try native Symbol.metadata first: lifecycle-decorators also write to context.metadata,
    // which is wired to Symbol.metadata when the runtime supports it natively.
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

    // Fallback via lifecycleMetadataMap: lifecycle-decorators store metadata keyed by
    // context.metadata (the shared metadata object per class). When native Symbol.metadata
    // is available, context.metadata === ctor[Symbol.metadata], so the lookup below finds it.
    // When Babel uses Symbol.for("Symbol.metadata") as fallback, the descriptor read above
    // finds nothing, but this WeakMap path still works as long as the same object reference
    // is accessible via ctor[Symbol.metadata].
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
