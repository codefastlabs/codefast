import type { Constructor } from "#/binding";
import type { Token } from "#/token";

/** Metadata written per `accessor` field decorated with `@inject`; collected into `Symbol.metadata`. */
export type AccessorInjectionMetadata = {
  readonly name: string;
  readonly token: Token<unknown> | Constructor<unknown>;
  readonly optional: boolean;
  readonly resolveHint?: {
    readonly name?: string;
    readonly tag?: readonly [tag: string, value: unknown];
  };
};

/** Lifecycle method names written by `@postConstruct()` / `@preDestroy()` into `Symbol.metadata`. */
export type LifecycleMetadata = {
  readonly postConstruct?: string;
  readonly preDestroy?: string;
  readonly accessorInjections?: readonly AccessorInjectionMetadata[];
};

/**
 * Per-parameter injection description collected by `@injectable()`.
 */
export type ParamMetadata = {
  readonly index: number;
  readonly token: Token<unknown> | Constructor<unknown>;
  readonly optional: boolean;
  readonly name?: string;
  readonly tag?: readonly [tag: string, value: unknown];
};

/**
 * Resolved form of an `inject()` / `optional()` call: token + optional flag + optional resolve hint.
 * Used both as a deps-array entry in `@injectable()` and as accessor-field injection metadata.
 */
export type InjectionDescriptor<Value = unknown> = {
  readonly token: Token<Value> | Constructor<Value>;
  readonly optional: boolean;
  readonly name?: string;
  readonly tag?: readonly [tag: string, value: unknown];
};

/**
 * Constructor injection shape stored on the class `Symbol.metadata` object.
 */
export type ConstructorMetadata = {
  readonly params: readonly ParamMetadata[];
};

/**
 * Abstraction for reading DI metadata (section 6.4) without tying callers to `Symbol.metadata`.
 */
export type MetadataReader = {
  getConstructorMetadata(
    implementationClass: Constructor<unknown>,
  ): ConstructorMetadata | undefined;
  getLifecycleMetadata?(implementationClass: Constructor<unknown>): LifecycleMetadata | undefined;
};
