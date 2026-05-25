/**
 * @since 0.3.16-canary.0
 */
export const INJECTABLE_KEY: unique symbol = Symbol("di:injectable");
/**
 * @since 0.3.16-canary.0
 */
export const LIFECYCLE_KEY: unique symbol = Symbol("di:lifecycle");
/**
 * @since 0.3.16-canary.0
 */
export const INJECT_ACCESSOR_KEY: unique symbol = Symbol("di:inject-accessor");

/**
 * The well-known symbol used by TC39 Stage 3 decorator transforms to store class metadata.
 *
 * `Symbol.metadata` is defined natively once the runtime ships the full TC39 decorator
 * proposal.  Until then (current Node.js / browsers), Babel and esbuild both fall back to
 * `Symbol.for("Symbol.metadata")` — a global-registry symbol with the same string key.
 * Resolving it here once keeps the reader and the decorator transforms in sync regardless
 * of which path is taken.
 *
 * @since 0.3.16-canary.0
 */
export const METADATA_SYMBOL: symbol = Symbol.metadata ?? Symbol.for("Symbol.metadata");
