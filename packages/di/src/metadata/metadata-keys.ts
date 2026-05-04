import type { ConstructorMetadata, MutableLifecycleMetadata } from "#/metadata/metadata-types";

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

// WeakMap fallbacks for runtimes where Symbol.metadata is not wired up (esbuild/tsx)
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
