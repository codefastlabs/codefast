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
 * Extracts the value type carried by a {@link Token} or the instance type of a {@link Constructor}.
 * Falls through to `never` for types that are neither a token nor a constructor.
 */
export type TokenValue<Type> =
  Type extends Token<infer Value>
    ? Value
    : Type extends abstract new (...args: never[]) => infer Value
      ? Value
      : never;

/**
 * Creates a frozen, type-safe injection token identified by `name`.
 *
 * The returned object is `Object.freeze`-d; `name` is used only for debugging and error
 * messages — binding lookup relies on **reference equality** of the token object.
 * Store the return value in a module-level `const` and import it wherever needed.
 *
 * @param name - Human-readable label (appears in error messages, graph output, and debug snapshots).
 */
export function token<Value>(name: string): Token<Value> {
  return Object.freeze({ name }) as Token<Value>;
}
