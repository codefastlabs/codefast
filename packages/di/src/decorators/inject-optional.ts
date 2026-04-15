import type { Constructor, ResolveHint } from "#lib/binding";
import { InvalidBindingError } from "#lib/errors";
import type { ParamMetadata } from "#lib/decorators/metadata";
import { getOrCreatePendingMap } from "#lib/decorators/param-registry";
import type { Token } from "#lib/token";

export type InjectOptionalParamOptions = ResolveHint;

function hintFromOptions(options: InjectOptionalParamOptions | undefined): ResolveHint | undefined {
  if (options === undefined) {
    return undefined;
  }
  if (options.name === undefined && options.tag === undefined && options.tagValue === undefined) {
    return undefined;
  }
  return {
    name: options.name,
    tag: options.tag,
    tagValue: options.tagValue,
  };
}

function toOptionalParamMetadata(
  token: Token<unknown>,
  options: InjectOptionalParamOptions | undefined,
): ParamMetadata {
  const hint = hintFromOptions(options);
  return hint === undefined ? { optional: true, token } : { optional: true, token, hint };
}

/**
 * Registers an optional constructor parameter injection (`undefined` when the token is not bound).
 */
export function registerInjectOptionalParam<Value>(
  ctor: Constructor<unknown>,
  parameterIndex: number,
  token: Token<Value>,
  options?: InjectOptionalParamOptions,
): void {
  const map = getOrCreatePendingMap(ctor);
  if (map.has(parameterIndex)) {
    throw new InvalidBindingError(
      `Duplicate inject metadata for constructor parameter index ${String(parameterIndex)} on "${ctor.name}".`,
    );
  }
  map.set(parameterIndex, toOptionalParamMetadata(token as Token<unknown>, options));
}

function injectOptionalDecoratorStub(): (value: unknown, context: DecoratorContext) => void {
  return () => {
    throw new InvalidBindingError(
      "The @injectOptional() decorator cannot be applied to constructor parameters in current TypeScript Stage 3 mode (TS1206). Use injectOptional.param(Constructor, parameterIndex, token, options?) from a static block instead.",
    );
  };
}

/**
 * `@injectOptional()` factory (throws at decoration time — see `injectOptional.param`).
 */
export const injectOptional = Object.assign(injectOptionalDecoratorStub, {
  param: registerInjectOptionalParam,
});
