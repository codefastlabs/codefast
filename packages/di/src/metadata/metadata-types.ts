import type { Constructor } from "#/binding";
import type { Token } from "#/token";

/**
 * Metadata written per `accessor` field decorated with `@inject`; collected into `Symbol.metadata`.
 */
export type AccessorInjectionMetadata = {
  /** Accessor property name to inject after construction. */
  readonly name: string;
  /** Token/constructor resolved for this accessor. */
  readonly token: Token<unknown> | Constructor<unknown>;
  /** Whether missing binding resolves to `undefined` instead of throwing. */
  readonly optional: boolean;
  /** Optional name/tag filter forwarded to binding selection. */
  readonly resolveHint?: {
    /** Named-binding discriminator (`whenNamed`). */
    readonly name?: string;
    /** Tagged-binding discriminator (`whenTagged`). */
    readonly tag?: readonly [tag: string, value: unknown];
  };
};

/**
 * Lifecycle method names written by `@postConstruct()` / `@preDestroy()` into `Symbol.metadata`.
 */
export type LifecycleMetadata = {
  /** Method name marked with `@postConstruct()`. */
  readonly postConstruct?: string;
  /** Method name marked with `@preDestroy()`. */
  readonly preDestroy?: string;
};

/**
 * Per-parameter injection description collected by `@injectable()`.
 */
export type ParamMetadata = {
  /** Zero-based constructor parameter index. */
  readonly index: number;
  /** Token/constructor used to resolve this parameter. */
  readonly token: Token<unknown> | Constructor<unknown>;
  /** Whether missing binding resolves to `undefined`. */
  readonly optional: boolean;
  /** Optional named-binding discriminator. */
  readonly name?: string;
  /** Optional tagged-binding discriminator. */
  readonly tag?: readonly [tag: string, value: unknown];
  /**
   * When true, the parameter receives every binding for `token` as an array (same semantics as
   * `Container.resolveAll` / `ResolutionContext.resolveAll`), using `name` / `tag` as a filter when set.
   */
  readonly all?: boolean;
};

/**
 * Resolved form of an `inject()` / `optional()` call: token + optional flag + optional resolve hint.
 * Used both as a deps-array entry in `@injectable()` and as accessor-field injection metadata.
 */
export type InjectionDescriptor<Value = unknown> = {
  /** Token/constructor to resolve. */
  readonly token: Token<Value> | Constructor<Value>;
  /** Whether unbound token should resolve as `undefined`. */
  readonly optional: boolean;
  /** Optional named-binding discriminator. */
  readonly name?: string;
  /** Optional tagged-binding discriminator. */
  readonly tag?: readonly [tag: string, value: unknown];
  /** When true, resolve every binding for {@link InjectionDescriptor.token} into an array. */
  readonly all?: boolean;
};

/**
 * Constructor injection shape stored on the class `Symbol.metadata` object.
 */
export type ConstructorMetadata = {
  /** Ordered constructor dependency descriptors. */
  readonly params: readonly ParamMetadata[];
};

/**
 * Abstraction for reading DI metadata without tying callers to `Symbol.metadata` directly.
 * The {@link DependencyResolver} uses this to instantiate `class` bindings and read lifecycle hooks.
 *
 * The default implementation is {@link SymbolMetadataReader}; consumers can supply a custom
 * reader (e.g. backed by a static config object) via `ResolverDependencies.metadataReader`.
 */
export type MetadataReader = {
  /**
   * Returns constructor parameter injection metadata for `implementationClass`, or `undefined`
   * if the class has no own `@injectable()` metadata. When a {@link MetadataReader} is
   * configured on the container, `undefined` here combined with `arity > 0` on the class
   * causes {@link MissingMetadataError} during resolution; when no reader is configured, the
   * resolver instantiates with zero arguments instead (see `DependencyResolver` class binding path).
   */
  getConstructorMetadata(
    implementationClass: Constructor<unknown>,
  ): ConstructorMetadata | undefined;
  /**
   * Returns lifecycle method names (`@postConstruct` / `@preDestroy`), or `undefined` if none.
   * Optional: when absent the resolver skips lifecycle hooks entirely.
   */
  getLifecycleMetadata?(implementationClass: Constructor<unknown>): LifecycleMetadata | undefined;
};
