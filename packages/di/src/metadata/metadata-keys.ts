export const CODEFAST_DI_CONSTRUCTOR_METADATA = "codefast/di:constructor-metadata:v1";
export const CODEFAST_DI_ACCESSOR_INJECTIONS = "codefast/di:accessor-injections:v1";
export const CODEFAST_DI_INJECT_ACCESSOR_FACTORY = Symbol.for(
  "codefast/di:inject-accessor-factory:v1",
);
export const CODEFAST_DI_LIFECYCLE_METADATA = "codefast/di:lifecycle-metadata:v1";
export function decoratorMetadataObjectSymbol(): symbol {
  return typeof Symbol.metadata === "symbol" ? Symbol.metadata : Symbol.for("Symbol.metadata");
}
