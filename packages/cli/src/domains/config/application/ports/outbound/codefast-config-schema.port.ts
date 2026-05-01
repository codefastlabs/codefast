import type { CodefastConfig } from "#/domains/config/domain/schema.domain";
import type { ZodError } from "zod";

export type CodefastConfigSchemaParseOutcome =
  | { readonly kind: "ok"; readonly config: CodefastConfig }
  | { readonly kind: "invalid_schema"; readonly zodError: ZodError };

/**
 * Validates raw loaded config (JSON/JS) against the `codefast.config` contract.
 * Does not throw — callers map {@link CodefastConfigSchemaParseOutcome} to user-facing errors.
 */
export interface CodefastConfigSchemaPort {
  safeParseLoadedConfig(raw: unknown): CodefastConfigSchemaParseOutcome;
}
