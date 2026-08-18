import type { Constructor } from "#/core/types";
import type { InjectionDescriptor } from "#/injection/descriptor";
import { INJECT_ACCESSOR_KEY, INJECTABLE_KEY, LIFECYCLE_KEY, METADATA_SYMBOL } from "#/metadata/metadata-keys";
import type { ConstructorMetadata, LifecycleMetadata, MetadataReader } from "#/metadata/metadata-types";

type AccessorEntry = { readonly key: string | symbol; readonly descriptor: InjectionDescriptor };

/**
 * @since 0.3.16-canary.0
 */
export class SymbolMetadataReader implements MetadataReader {
  // Merged chain answers, cached per class: decorator metadata cannot change once a class is defined.
  #lifecycleByClass: WeakMap<Constructor, LifecycleMetadata | null> | undefined;
  #accessorsByClass: WeakMap<Constructor, ReadonlyArray<AccessorEntry> | null> | undefined;

  /**
   * Whatever a decorator stored under `key` on this exact class, narrowed as far as the platform allows.
   *
   * @remarks Own-property only: an inherited `Symbol.metadata` belongs to the base class. Constructor
   * metadata must not be borrowed (each class opts into its deps); the lifecycle and accessor readers
   * walk the base chain themselves, because the platform runs inherited members regardless.
   */
  #read(target: object, key: string | symbol): unknown {
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

  /** Each class level's own bucket under `key`, base first — the order construction runs them. */
  #ownBucketsBaseFirst(target: Constructor, key: string | symbol): Array<unknown> {
    const buckets: Array<unknown> = [];
    let current: unknown = target;
    while (typeof current === "function" && current !== Function.prototype) {
      const bucket = this.#read(current, key);
      if (bucket !== undefined) {
        buckets.unshift(bucket);
      }
      current = Object.getPrototypeOf(current);
    }
    return buckets;
  }

  getConstructorMetadata(target: Constructor): ConstructorMetadata | undefined {
    return this.#read(target, INJECTABLE_KEY) as ConstructorMetadata | undefined;
  }

  /**
   * Lifecycle hooks aggregated over the base chain — an inherited hook method exists on the instance.
   *
   * @remarks `postConstruct` runs base first (a derived hook may rely on base state); `preDestroy`
   * runs derived first, mirroring teardown. A method name repeated across levels runs once.
   */
  getLifecycleMetadata(target: Constructor): LifecycleMetadata | undefined {
    const cached = this.#lifecycleByClass?.get(target);
    if (cached !== undefined) {
      return cached ?? undefined;
    }
    const buckets = this.#ownBucketsBaseFirst(target, LIFECYCLE_KEY) as Array<LifecycleMetadata>;
    let merged: LifecycleMetadata | null;
    if (buckets.length === 0) {
      merged = null;
    } else if (buckets.length === 1) {
      merged = buckets[0]!;
    } else {
      merged = {
        postConstruct: mergeUniqueNames(buckets.map((bucket) => bucket.postConstruct)),
        preDestroy: mergeUniqueNames(buckets.map((bucket) => bucket.preDestroy).reverse()),
      };
    }
    (this.#lifecycleByClass ??= new WeakMap<Constructor, LifecycleMetadata | null>()).set(target, merged);
    return merged ?? undefined;
  }

  /**
   * Accessor injections aggregated over the base chain, base first — the order initializers run.
   *
   * @remarks Not deduplicated: a derived accessor shadowing a base one still runs both initializers.
   */
  getAccessorMetadata(target: Constructor): ReadonlyArray<AccessorEntry> | undefined {
    const cached = this.#accessorsByClass?.get(target);
    if (cached !== undefined) {
      return cached ?? undefined;
    }
    const buckets = this.#ownBucketsBaseFirst(target, INJECT_ACCESSOR_KEY) as Array<ReadonlyArray<AccessorEntry>>;
    let merged: ReadonlyArray<AccessorEntry> | null;
    if (buckets.length === 0) {
      merged = null;
    } else if (buckets.length === 1) {
      merged = buckets[0]!;
    } else {
      merged = buckets.flat();
    }
    (this.#accessorsByClass ??= new WeakMap<Constructor, ReadonlyArray<AccessorEntry> | null>()).set(target, merged);
    return merged ?? undefined;
  }
}

/** Concatenates hook-name lists in the given order, keeping each name's first occurrence. */
function mergeUniqueNames(lists: Array<ReadonlyArray<string>>): Array<string> {
  const seen = new Set<string>();
  const merged: Array<string> = [];
  for (const list of lists) {
    for (const name of list) {
      if (!seen.has(name)) {
        seen.add(name);
        merged.push(name);
      }
    }
  }
  return merged;
}

/**
 * @since 0.3.16-canary.0
 */
export const defaultMetadataReader: SymbolMetadataReader = new SymbolMetadataReader();
