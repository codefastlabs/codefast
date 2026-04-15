import type { Constructor, ResolveHint } from "#lib/binding";
import { InvalidBindingError } from "#lib/errors";
import type { ParamMetadata } from "#lib/decorators/metadata";
import { getOrCreatePendingMap } from "#lib/decorators/param-registry";
import type { Token } from "#lib/token";

export type InjectParamOptions = ResolveHint;

function hintFromOptions(options: InjectParamOptions | undefined): ResolveHint | undefined {
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

function toParamMetadata(
  token: Token<unknown>,
  optional: boolean,
  options: InjectParamOptions | undefined,
): ParamMetadata {
  const hint = hintFromOptions(options);
  if (optional) {
    return hint === undefined ? { optional: true, token } : { optional: true, token, hint };
  }
  return hint === undefined ? { optional: false, token } : { optional: false, token, hint };
}

/**
 * Registers a required constructor parameter injection. Call from a `static { }` block on the same
 * class so registrations exist before `@injectable()` finalizes `Symbol.metadata`.
 *
 * TypeScript Stage 3 does not yet allow decorators on constructor parameters (TS1206); this is the
 * supported registration surface until parameter decorators land.
 */
export function registerInjectParam<Value>(
  ctor: Constructor<unknown>,
  parameterIndex: number,
  token: Token<Value>,
  options?: InjectParamOptions,
): void {
  const map = getOrCreatePendingMap(ctor);
  if (map.has(parameterIndex)) {
    throw new InvalidBindingError(
      `Duplicate inject metadata for constructor parameter index ${String(parameterIndex)} on "${ctor.name}".`,
    );
  }
  map.set(parameterIndex, toParamMetadata(token as Token<unknown>, false, options));
}

function injectDecoratorStub<Value>(
  token: Token<Value>,
  options?: InjectParamOptions,
): (value: unknown, context: DecoratorContext) => void {
  void token;
  void options;
  return () => {
    throw new InvalidBindingError(
      "The @inject() decorator cannot be applied to constructor parameters in current TypeScript Stage 3 mode (TS1206). Use inject.param(Constructor, parameterIndex, token, options?) from a static block instead.",
    );
  };
}

/**
 * `@inject(token, opts?)` factory (throws at decoration time — see `inject.param` for supported registration).
 */
export const inject = Object.assign(injectDecoratorStub, {
  param: registerInjectParam,
});
