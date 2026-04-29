import type { Constructor } from "#/types";
import type { Token } from "#/token";

export interface ParamMetadata {
  readonly index: number;
  readonly token: Token<unknown> | Constructor;
  readonly optional: boolean;
  readonly multi: boolean;
  readonly name?: string;
  readonly tags?: ReadonlyArray<readonly [string, unknown]>;
}

export interface ConstructorMetadata {
  readonly params: readonly ParamMetadata[];
}

export interface LifecycleMetadata {
  readonly postConstruct: readonly string[];
  readonly preDestroy: readonly string[];
}

/** Mutable buckets used while aggregating decorator metadata (same keys as {@link LifecycleMetadata}). */
export interface MutableLifecycleMetadata {
  postConstruct: string[];
  preDestroy: string[];
}

export interface MetadataReader {
  getConstructorMetadata(target: Constructor): ConstructorMetadata | undefined;
  getLifecycleMetadata(target: Constructor): LifecycleMetadata | undefined;
}
