/**
 * The metadata key `@injectable` writes a class's constructor dependencies under.
 *
 * @since 0.3.16-canary.0
 */
export const INJECTABLE_KEY: unique symbol = Symbol("di:injectable");
/**
 * The metadata key `@postConstruct` and `@preDestroy` record method names under.
 *
 * @since 0.3.16-canary.0
 */
export const LIFECYCLE_KEY: unique symbol = Symbol("di:lifecycle");
/**
 * The metadata key `@inject` accessors record their injection descriptors under.
 *
 * @since 0.3.16-canary.0
 */
export const INJECT_ACCESSOR_KEY: unique symbol = Symbol("di:inject-accessor");

/**
 * The symbol TC39 Stage 3 decorator transforms store class metadata under.
 *
 * @remarks Falls back to the global-registry symbol, which is what Babel and esbuild emit until
 * a runtime ships `Symbol.metadata` natively.
 *
 * @since 0.3.16-canary.0
 */
export const METADATA_SYMBOL: symbol = Symbol.metadata ?? Symbol.for("Symbol.metadata");
