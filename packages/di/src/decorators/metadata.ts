import type { Constructor } from "#/binding";
import type { Token } from "#/token";

/**
 * Well-known key for Codefast DI constructor metadata on `Symbol.metadata`.
 */
export const CODEFAST_DI_CONSTRUCTOR_METADATA = "codefast/di:constructor-metadata:v1";

export const CODEFAST_DI_ACCESSOR_INJECTIONS = "codefast/di:accessor-injections:v1";
export const CODEFAST_DI_LIFECYCLE_METADATA = "codefast/di:lifecycle-metadata:v1";

export type AccessorInjectionMetadata = {
  readonly name: string;
  readonly token: Token<unknown> | Constructor<unknown>;
  readonly optional: boolean;
  readonly resolveHint?: {
    readonly name?: string;
    readonly tag?: readonly [tag: string | symbol, value: unknown];
  };
};

export type LifecycleMetadata = {
  readonly postConstruct?: string;
  readonly preDestroy?: string;
  readonly accessorInjections?: readonly AccessorInjectionMetadata[];
};

/**
 * Runtime symbol for the decorator metadata object (TC39 `Symbol.metadata`).
 * Node may expose this only via `Symbol.for("Symbol.metadata")` until the global
 * `Symbol.metadata` property is available.
 */
export function decoratorMetadataObjectSymbol(): symbol {
  return typeof Symbol.metadata === "symbol" ? Symbol.metadata : Symbol.for("Symbol.metadata");
}

/**
 * Per-parameter injection description collected by `@injectable()`.
 */
export type ParamMetadata = {
  readonly index: number;
  readonly token: Token<unknown> | Constructor<unknown>;
  readonly optional: boolean;
  readonly name?: string;
  readonly tag?: readonly [tag: string | symbol, value: unknown];
};

export type InjectionDescriptor<Value = unknown> = {
  readonly token: Token<Value> | Constructor<Value>;
  readonly optional: boolean;
  readonly name?: string;
  readonly tag?: readonly [tag: string | symbol, value: unknown];
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
  getConstructorMetadata(ctor: Constructor<unknown>): ConstructorMetadata | undefined;
  getLifecycleMetadata?(ctor: Constructor<unknown>): LifecycleMetadata | undefined;
};
