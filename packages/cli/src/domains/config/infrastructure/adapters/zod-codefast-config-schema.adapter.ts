import { injectable } from "@codefast/di";
import { codefastConfigRootSchema } from "#/domains/config/domain/codefast-config.schema";
import type {
  CodefastConfigSchemaParseOutcome,
  CodefastConfigSchemaPort,
} from "#/domains/config/application/ports/codefast-config-schema.port";

/**
 * Driven adapter: Zod implementation of the config file schema port.
 */
@injectable()
export class ZodCodefastConfigSchemaAdapter implements CodefastConfigSchemaPort {
  safeParseLoadedConfig(raw: unknown): CodefastConfigSchemaParseOutcome {
    const parsed = codefastConfigRootSchema.safeParse(raw);
    if (parsed.success) {
      return { kind: "ok", config: parsed.data };
    }
    return { kind: "invalid_schema", zodError: parsed.error };
  }
}
