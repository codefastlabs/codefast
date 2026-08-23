import type { Constructor } from "#/core/types";
import type { InjectionDescriptor } from "#/injection/descriptor";
import type { DependencySlot } from "#/injection/resolve-options";

/**
 * One constructor parameter's declaration.
 *
 * @remarks Extends {@link DependencySlot} so the two dependency sources stay literally one shape
 * rather than two that happen to match; `index` is the only thing a parameter adds.
 *
 * @since 0.3.16-canary.0
 */
export interface ParamMetadata extends DependencySlot {
  readonly index: number;
}

/**
 * A class's declared constructor dependencies, as a `MetadataReader` reports them.
 *
 * @since 0.3.16-canary.0
 */
export interface ConstructorMetadata {
  readonly params: ReadonlyArray<ParamMetadata>;
}

/**
 * The `postConstruct` and `preDestroy` method names a class declares.
 *
 * @since 0.3.16-canary.0
 */
export interface LifecycleMetadata {
  readonly postConstruct: ReadonlyArray<string>;
  readonly preDestroy: ReadonlyArray<string>;
}

/**
 * Mutable buckets used while aggregating decorator metadata (same keys as {@link LifecycleMetadata}).
 *
 * @since 0.3.16-canary.0
 */
export interface MutableLifecycleMetadata {
  postConstruct: Array<string>;
  preDestroy: Array<string>;
}

/**
 * The port a container reads class metadata through — constructor deps, lifecycle, and accessors.
 *
 * @since 0.3.16-canary.0
 */
export interface MetadataReader {
  getConstructorMetadata(target: Constructor): ConstructorMetadata | undefined;
  getLifecycleMetadata(target: Constructor): LifecycleMetadata | undefined;
  getAccessorMetadata?(
    target: Constructor,
  ): ReadonlyArray<{ readonly key: string | symbol; readonly descriptor: InjectionDescriptor }> | undefined;
}
