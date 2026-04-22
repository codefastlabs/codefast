/**
 * Well-known property key for constructor injection metadata on `Symbol.metadata`.
 * Written by `@injectable()`, read by `SymbolMetadataReader.getConstructorMetadata()`.
 * The `:v1` suffix is a schema version — bump only when the `ConstructorMetadata` shape changes.
 */
export const CODEFAST_DI_CONSTRUCTOR_METADATA = "codefast/di:constructor-metadata:v1";

/**
 * Well-known property key for accessor-field injection metadata on `Symbol.metadata`.
 * Written by `@inject()` when used as an accessor decorator; read during post-construction
 * property injection by the resolver.
 */
export const CODEFAST_DI_ACCESSOR_INJECTIONS = "codefast/di:accessor-injections:v1";

/**
 * Marks an {@link InjectionDescriptor} produced by {@link inject} when the one-arg overload
 * must also serve as an accessor decorator factory (merged callable + descriptor).
 * @internal
 */
export const CODEFAST_DI_INJECT_ACCESSOR_FACTORY = Symbol.for(
  "codefast/di:inject-accessor-factory:v1",
);
/**
 * Well-known key for lifecycle method names written by `@postConstruct()` / `@preDestroy()`.
 */
export const CODEFAST_DI_LIFECYCLE_METADATA = "codefast/di:lifecycle-metadata:v1";

/**
 * Returns the runtime symbol used to access TC39 decorator metadata on a class.
 *
 * Prefers the native `Symbol.metadata` when available (Stage 3 decorators); falls back to
 * `Symbol.for("Symbol.metadata")` for Node/runtime versions that polyfill or partially
 * implement the proposal. The fallback key is the de facto convention used by TypeScript
 * and polyfill libraries.
 */
export function decoratorMetadataObjectSymbol(): symbol {
  return typeof Symbol.metadata === "symbol" ? Symbol.metadata : Symbol.for("Symbol.metadata");
}
