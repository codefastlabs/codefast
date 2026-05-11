import type { Constructor } from "#/constructor-type";

declare const TOKEN_BRAND: unique symbol;

/**
 * @since 0.3.16-canary.0
 */
export interface Token<Value> {
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
export function tokenName(t: Token<unknown> | Constructor): string {
  if (typeof t === "function") {
    return t.name;
  }
  return (t as Token<unknown>).name;
}

/**
 * @since 0.3.16-canary.0
 */
export function isToken(value: unknown): value is Token<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    typeof (value as Record<string, unknown>)["name"] === "string"
  );
}
