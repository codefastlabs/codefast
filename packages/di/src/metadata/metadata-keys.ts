/**
 * Well-known key for Codefast DI constructor metadata on `Symbol.metadata`.
 */
export const CODEFAST_DI_CONSTRUCTOR_METADATA = "codefast/di:constructor-metadata:v1";

export const CODEFAST_DI_ACCESSOR_INJECTIONS = "codefast/di:accessor-injections:v1";
export const CODEFAST_DI_LIFECYCLE_METADATA = "codefast/di:lifecycle-metadata:v1";

/**
 * Runtime symbol for the decorator metadata object (TC39 `Symbol.metadata`).
 * Node may expose this only via `Symbol.for("Symbol.metadata")` until the global
 * `Symbol.metadata` property is available.
 */
export function decoratorMetadataObjectSymbol(): symbol {
  return typeof Symbol.metadata === "symbol" ? Symbol.metadata : Symbol.for("Symbol.metadata");
}
