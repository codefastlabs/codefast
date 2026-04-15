declare const diTokenBrand: unique symbol;

/**
 * Opaque injection key branded by `Value` so distinct tokens do not unify in the type system.
 * Registry keys rely on **reference equality** — always reuse the same `token()` result as the key.
 */
export type Token<Value> = {
  readonly [diTokenBrand]: Value;
  readonly name: string;
};

/**
 * Creates a type-safe injection token identified by `name` (for debugging and errors).
 */
export function token<Value>(name: string): Token<Value> {
  return Object.freeze({ name }) as Token<Value>;
}
