import type { Constructor } from "#/core/constructor-type";

declare const TOKEN_BRAND: unique symbol;

/**
 * A branded identifier carrying the value type its bindings resolve to.
 *
 * @since 0.3.16-canary.0
 */
export interface Token<out Value> {
  readonly name: string;
  readonly [TOKEN_BRAND]: Value;
}

/**
 * Creates a named `Token` for the given value type.
 *
 * @since 0.3.16-canary.0
 */
export function token<Value>(name: string): Token<Value> {
  return { name } as Token<Value>;
}

/**
 * Returns the display name of a token or class used as a dependency key.
 *
 * @since 0.3.16-canary.0
 */
export function tokenName(dependency: Token<unknown> | Constructor): string {
  return dependency.name;
}
