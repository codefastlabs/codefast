/**
 * Lightweight functional Result type for CLI boundaries.
 */

type Ok<Value> = { readonly ok: true; readonly value: Value };

type Err<ErrorValue> = { readonly ok: false; readonly error: ErrorValue };

/**
 * A discriminated success-or-error union tagged by its `ok` flag.
 *
 * @since 0.3.16-canary.0
 */
export type Result<Value, ErrorValue> = Ok<Value> | Err<ErrorValue>;

/**
 * Wraps a value in a success `Result`.
 *
 * @since 0.3.16-canary.0
 */
export function ok<Value>(value: Value): Ok<Value> {
  return { ok: true, value };
}

/**
 * Wraps an error in a failure `Result`.
 *
 * @since 0.3.16-canary.0
 */
export function err<ErrorValue>(error: ErrorValue): Err<ErrorValue> {
  return { ok: false, error };
}
