/**
 * A class token: newable, producing `Value`.
 *
 * @remarks Rest parameters are `never[]` so classes with typed constructors stay assignable under
 * `strictFunctionTypes`. Construction uses the real shape; this alias is the token surface only.
 *
 * @since 0.3.16-canary.0
 */
export type Constructor<Value = unknown> = new (...args: Array<never>) => Value;

/**
 * Class constructor as invoked by the resolver after metadata-driven
 * resolution of `unknown[]` dependencies — separate from {@link Constructor},
 * which is the public assignable class token.
 *
 * @since 0.3.16-canary.0
 */
export type ConstructorInvocation = new (...args: Array<unknown>) => unknown;
