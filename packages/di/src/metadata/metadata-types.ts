import type { Constructor } from "#/binding";
import type { Token } from "#/token";
export type AccessorInjectionMetadata = {
  readonly name: string;
  readonly token: Token<unknown> | Constructor<unknown>;
  readonly optional: boolean;
  readonly resolveHint?: {
    readonly name?: string;
    readonly tag?: readonly [tag: string, value: unknown];
  };
};
export type LifecycleMetadata = {
  readonly postConstruct?: string;
  readonly preDestroy?: string;
};
export type ParamMetadata = {
  readonly index: number;
  readonly token: Token<unknown> | Constructor<unknown>;
  readonly optional: boolean;
  readonly name?: string;
  readonly tag?: readonly [tag: string, value: unknown];
  readonly isInjectAllBindings?: boolean;
};
export type InjectionDescriptor<Value = unknown> = {
  readonly token: Token<Value> | Constructor<Value>;
  readonly optional: boolean;
  readonly name?: string;
  readonly tag?: readonly [tag: string, value: unknown];
  readonly isInjectAllBindings?: boolean;
};
export type ConstructorMetadata = {
  readonly params: readonly ParamMetadata[];
};
export type MetadataReader = {
  getConstructorMetadata(
    implementationClass: Constructor<unknown>,
  ): ConstructorMetadata | undefined;
  getLifecycleMetadata?(implementationClass: Constructor<unknown>): LifecycleMetadata | undefined;
};
