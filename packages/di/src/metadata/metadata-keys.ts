import type { ConstructorMetadata, MutableLifecycleMetadata } from "#/metadata/metadata-types";

/**
 * Accessor injection entries mirrored from `Symbol.metadata` for toolchains where
 * resolver reads stable metadata via the same object identity as `context.metadata`.
 *
 * @since 0.3.16-canary.0
 */
export type AccessorInjectionEntryList = Array<{
  key: string | symbol;
  descriptor: unknown;
}>;

/**
 * @since 0.3.16-canary.0
 */
export const INJECTABLE_KEY: unique symbol = Symbol("di:injectable");
/**
 * @since 0.3.16-canary.0
 */
export const LIFECYCLE_KEY: unique symbol = Symbol("di:lifecycle");
/**
 * @since 0.3.16-canary.0
 */
export const INJECT_ACCESSOR_KEY: unique symbol = Symbol("di:inject-accessor");

// WeakMap mirrors — fallback storage when Symbol.metadata is unavailable or when Babel's
// decorator transform uses Symbol.for("Symbol.metadata") instead of the native symbol,
// causing Object.getOwnPropertyDescriptor(target, Symbol.metadata) to find nothing.
/**
 * @since 0.3.16-canary.0
 */
export const constructorMetadataMap = new WeakMap<object, ConstructorMetadata>();
/**
 * @since 0.3.16-canary.0
 */
export const lifecycleMetadataMap = new WeakMap<object, MutableLifecycleMetadata>();
/**
 * @since 0.3.16-canary.0
 */
export const lifecycleByConstructorMetadataMap = new WeakMap<object, MutableLifecycleMetadata>();

/**
 * Fallback keyed by the class metadata object (`context.metadata` / `ctor[Symbol.metadata]`).
 *
 * @since 0.3.16-canary.0
 */
export const accessorMetadataByMetadataObjectMap = new WeakMap<
  object,
  AccessorInjectionEntryList
>();

/**
 * Populated from `@injectable()` after field decorators have written `INJECT_ACCESSOR_KEY`
 * onto `context.metadata` — same timing as {@link constructorMetadataMap}.
 *
 * @since 0.3.16-canary.0
 */
export const accessorMetadataByConstructorMap = new WeakMap<object, AccessorInjectionEntryList>();
