import type { Constructor, ResolveHint } from "#lib/binding";
import type { Token } from "#lib/token";

/**
 * Well-known key for Codefast DI constructor metadata on `Symbol.metadata`.
 */
export const CODEFAST_DI_CONSTRUCTOR_METADATA = "codefast/di:constructor-metadata:v1";

/**
 * Runtime symbol for the decorator metadata object (TC39 `Symbol.metadata`).
 * Node may expose this only via `Symbol.for("Symbol.metadata")` until the global
 * `Symbol.metadata` property is available.
 */
export function decoratorMetadataObjectSymbol(): symbol {
  return typeof Symbol.metadata === "symbol" ? Symbol.metadata : Symbol.for("Symbol.metadata");
}

/**
 * Per-parameter injection description collected by `@injectable()`.
 */
export type ParamMetadata =
  | {
      readonly optional: false;
      readonly token: Token<unknown>;
      readonly hint?: ResolveHint;
    }
  | {
      readonly optional: true;
      readonly token: Token<unknown>;
      readonly hint?: ResolveHint;
    };

/**
 * Constructor injection shape stored on the class `Symbol.metadata` object.
 */
export type ConstructorMetadata = {
  readonly parameters: readonly ParamMetadata[];
};

/**
 * Abstraction for reading DI metadata (section 6.4) without tying callers to `Symbol.metadata`.
 */
export type MetadataReader = {
  getConstructorMetadata(ctor: Constructor<unknown>): ConstructorMetadata | undefined;
};
