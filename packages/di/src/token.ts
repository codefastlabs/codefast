declare const TOKEN_BRAND: unique symbol;

/**
 * Opaque injection key branded by `Value` so distinct tokens do not unify in the type system.
 * Registry keys rely on **reference equality** — always reuse the same `token()` result as the key.
 */
export type Token<Value> = {
  readonly [TOKEN_BRAND]: Value;
  readonly name: string;
};

/**
 * Extracts the value type carried by a {@link Token}.
 */
export type TokenValue<Type> =
  Type extends Token<infer Value>
    ? Value
    : Type extends abstract new (...args: never[]) => infer Value
      ? Value
      : never;

/**
 * Creates a type-safe injection token identified by `name` (for debugging and errors).
 */
export function token<Value>(name: string): Token<Value> {
  return Object.freeze({ name }) as Token<Value>;
}
