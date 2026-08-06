import type { Constructor } from "#/core/types";
import type { InjectionDescriptor } from "#/decorators/inject";
import { INJECT_ACCESSOR_KEY, INJECTABLE_KEY, LIFECYCLE_KEY, METADATA_SYMBOL } from "#/metadata/metadata-keys";
import type { ConstructorMetadata, LifecycleMetadata, MetadataReader } from "#/metadata/metadata-types";

/**
 * @since 0.3.16-canary.0
 */
export class SymbolMetadataReader implements MetadataReader {
  /**
   * Whatever a decorator stored under `key`, narrowed as far as the platform allows.
   *
   * @remarks Own-property only: an inherited `Symbol.metadata` belongs to the base class, and a
   * subclass without `@injectable()` must not borrow it. The value stays `unknown` — declaring its
   * shape is the caller's claim, and {@link assertConstructorMetadata} is what verifies it.
   */
  #read(target: Constructor, key: string | symbol): unknown {
    const descriptor = Object.getOwnPropertyDescriptor(target, METADATA_SYMBOL);
    if (descriptor === undefined) {
      return undefined;
    }
    const record: unknown = descriptor.value;
    if (typeof record !== "object" || record === null || !Object.hasOwn(record, key)) {
      return undefined;
    }
    return Reflect.get(record, key);
  }

  getConstructorMetadata(target: Constructor): ConstructorMetadata | undefined {
    return this.#read(target, INJECTABLE_KEY) as ConstructorMetadata | undefined;
  }

  getLifecycleMetadata(target: Constructor): LifecycleMetadata | undefined {
    return this.#read(target, LIFECYCLE_KEY) as LifecycleMetadata | undefined;
  }

  getAccessorMetadata(
    target: Constructor,
  ): Array<{ key: string | symbol; descriptor: InjectionDescriptor }> | undefined {
    return this.#read(target, INJECT_ACCESSOR_KEY) as
      | Array<{ key: string | symbol; descriptor: InjectionDescriptor }>
      | undefined;
  }
}

/**
 * @since 0.3.16-canary.0
 */
export const defaultMetadataReader = new SymbolMetadataReader();
