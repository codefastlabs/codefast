declare const TOKEN_BRAND: unique symbol;
export type Token<Value> = {
  readonly [TOKEN_BRAND]: Value;
  readonly name: string;
};
export type TokenValue<Type> =
  Type extends Token<infer Value>
    ? Value
    : Type extends abstract new (...args: never[]) => infer Value
      ? Value
      : never;
export function token<Value>(name: string): Token<Value> {
  return Object.freeze({ name }) as Token<Value>;
}
