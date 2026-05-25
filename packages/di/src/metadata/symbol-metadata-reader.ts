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
    // Primary path: read from native Symbol.metadata when the decorator runtime wired
    // context.metadata into it (TypeScript native Stage 3 emit, Node 22+ native decorators).
    const metadataDescriptor = Object.getOwnPropertyDescriptor(target, Symbol.metadata);
    if (metadataDescriptor !== undefined) {
      const metadataRecord = metadataDescriptor.value as
        | Record<string | symbol, unknown>
        | null
        | undefined;
      if (
        metadataRecord &&
        typeof metadataRecord === "object" &&
        Object.hasOwn(metadataRecord, INJECTABLE_KEY)
      ) {
        return metadataRecord[INJECTABLE_KEY] as ConstructorMetadata;
      }
    }

    // Fallback mirror: WeakMap keyed by constructor, written by @injectable().
    // Covers runtimes where Babel uses Symbol.for("Symbol.metadata") instead of the
    // native symbol, making the descriptor read above find nothing.
    return constructorMetadataMap.get(target);
  }

  getLifecycleMetadata(target: Constructor): LifecycleMetadata | undefined {
    // Primary path: read from native Symbol.metadata.
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

    // Fallback mirror (1): lifecycle-decorators store metadata in lifecycleMetadataMap keyed
    // by context.metadata. When native Symbol.metadata is available,
    // context.metadata === ctor[Symbol.metadata], so the lookup below finds it.
    // When Babel uses Symbol.for("Symbol.metadata"), the descriptor read above finds nothing
    // but this WeakMap path still works via the same object reference.
    const classMetadataObject = (target as { [Symbol.metadata]?: object })[Symbol.metadata];
    if (classMetadataObject !== undefined) {
      const fromMetadataObject = lifecycleMetadataMap.get(classMetadataObject);
      if (fromMetadataObject !== undefined) {
        return fromMetadataObject;
      }
    }

    // Fallback mirror (2): constructor-keyed WeakMap written by lifecycle decorator
    // initializers — last resort when neither Symbol.metadata nor the metadata-object
    // map yields a result.
    return lifecycleByConstructorMetadataMap.get(target);
  }

  getAccessorMetadata(
    target: Constructor,
  ): Array<{ key: string | symbol; descriptor: InjectionDescriptor }> | undefined {
    // Primary path: read from native Symbol.metadata.
    const metadataDescriptor = Object.getOwnPropertyDescriptor(target, Symbol.metadata);
    if (metadataDescriptor !== undefined) {
      const metadataRecord = metadataDescriptor.value as
        | Record<string | symbol, unknown>
        | null
        | undefined;
      if (
        metadataRecord &&
        typeof metadataRecord === "object" &&
        Object.hasOwn(metadataRecord, INJECT_ACCESSOR_KEY)
      ) {
        return metadataRecord[INJECT_ACCESSOR_KEY] as Array<{
          key: string | symbol;
          descriptor: InjectionDescriptor;
        }>;
      }
    }

    // Fallback mirror (1): accessor decorators write to accessorMetadataByMetadataObjectMap
    // keyed by context.metadata. When Babel uses Symbol.for("Symbol.metadata"), the
    // descriptor read above finds nothing but this WeakMap path still works via the same
    // object reference accessible through ctor[Symbol.metadata].
    const metadataObject = (target as { [Symbol.metadata]?: object })[Symbol.metadata];
    if (metadataObject !== undefined) {
      const fromMetadataObject = accessorMetadataByMetadataObjectMap.get(metadataObject);
      if (fromMetadataObject !== undefined) {
        return fromMetadataObject as Array<{
          key: string | symbol;
          descriptor: InjectionDescriptor;
        }>;
      }
    }

    // Fallback mirror (2): constructor-keyed WeakMap populated by @injectable() after
    // field decorators have run — last resort.
    return accessorMetadataByConstructorMap.get(target) as
      | Array<{ key: string | symbol; descriptor: InjectionDescriptor }>
      | undefined;
  }
}

/**
 * @since 0.3.16-canary.0
 */
export const defaultMetadataReader = new SymbolMetadataReader();
