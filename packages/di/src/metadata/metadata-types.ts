import type { Constructor } from "#/types";
import type { Token } from "#/token";

/**
 * @since 0.3.16-canary.0
 */
export interface ParamMetadata {
  readonly index: number;
  readonly token: Token<unknown> | Constructor;
  readonly optional: boolean;
  readonly multi: boolean;
  readonly name?: string;
  readonly tags?: ReadonlyArray<readonly [string, unknown]>;
}

/**
 * @since 0.3.16-canary.0
 */
export interface ConstructorMetadata {
  readonly params: readonly ParamMetadata[];
}

/**
 * @since 0.3.16-canary.0
 */
export interface LifecycleMetadata {
  readonly postConstruct: readonly string[];
  readonly preDestroy: readonly string[];
}

/**
 * Mutable buckets used while aggregating decorator metadata (same keys as {@link LifecycleMetadata}).
 *
 * @since 0.3.16-canary.0
 */
export interface MutableLifecycleMetadata {
  postConstruct: string[];
  preDestroy: string[];
}

/**
 * @since 0.3.16-canary.0
 */
export interface MetadataReader {
  getConstructorMetadata(target: Constructor): ConstructorMetadata | undefined;
  getLifecycleMetadata(target: Constructor): LifecycleMetadata | undefined;
}
