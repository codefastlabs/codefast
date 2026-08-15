import type { Constructor } from "#/core/constructor-type";

declare const TOKEN_BRAND: unique symbol;

/**
 * @since 0.3.16-canary.0
 */
export interface Token<out Value> {
  readonly name: string;
  readonly [TOKEN_BRAND]: Value;
}

/**
 * @since 0.3.16-canary.0
 */
export function token<Value>(name: string): Token<Value> {
  return { name } as Token<Value>;
}

/**
 * @since 0.3.16-canary.0
 */
export function tokenName(dependency: Token<unknown> | Constructor): string {
  return dependency.name;
}
