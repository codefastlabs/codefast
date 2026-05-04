/**
 * A class (newable) that produces `Value`. Rest parameters are `never[]` so
 * real classes with typed constructors remain assignable under
 * `strictFunctionTypes` (unlike `unknown[]`, which is not assignable from
 * narrower parameter types). Runtime construction still uses the real shape;
 * this alias is the DI “class token” surface only.
 *
 * @since 0.3.16-canary.0
 */
export type Constructor<Value = unknown> = new (...args: never[]) => Value;

/**
 * Class constructor as invoked by the resolver after metadata-driven
 * resolution of `unknown[]` dependencies — separate from {@link Constructor},
 * which is the public assignable class token.
 *
 * @since 0.3.16-canary.0
 */
export type ConstructorInvocation = new (...args: unknown[]) => unknown;
