/**
 * Lightweight functional Result type for CLI boundaries.
 */

type Ok<Value> = { readonly ok: true; readonly value: Value };

type Err<ErrorValue> = { readonly ok: false; readonly error: ErrorValue };

/**
 * @since 0.3.16-canary.0
 */
export type Result<Value, ErrorValue> = Ok<Value> | Err<ErrorValue>;

/**
 * @since 0.3.16-canary.0
 */
export function ok<Value>(value: Value): Ok<Value> {
  return { ok: true, value };
}

/**
 * @since 0.3.16-canary.0
 */
export function err<ErrorValue>(error: ErrorValue): Err<ErrorValue> {
  return { ok: false, error };
}
