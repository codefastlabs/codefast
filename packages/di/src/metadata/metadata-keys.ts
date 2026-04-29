import type { ConstructorMetadata, MutableLifecycleMetadata } from "#/metadata/metadata-types";

export const INJECTABLE_KEY: unique symbol = Symbol("di:injectable");
export const LIFECYCLE_KEY: unique symbol = Symbol("di:lifecycle");
export const INJECT_ACCESSOR_KEY: unique symbol = Symbol("di:inject-accessor");

// WeakMap fallbacks for runtimes where Symbol.metadata is not wired up (esbuild/tsx)
export const constructorMetadataMap = new WeakMap<object, ConstructorMetadata>();
export const lifecycleMetadataMap = new WeakMap<object, MutableLifecycleMetadata>();
export const lifecycleByConstructorMetadataMap = new WeakMap<object, MutableLifecycleMetadata>();
