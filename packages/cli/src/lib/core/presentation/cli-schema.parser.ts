import type { SchemaValidator } from "#/lib/core/application/services/schema-validator.service";
import { parseWithSchema } from "#/lib/core/application/services/schema-validator.service";
import type { AppError } from "#/lib/core/domain/errors.domain";
import type { Result } from "#/lib/core/domain/result.model";

export function parseWithCliSchema<T>(
  schema: SchemaValidator<T>,
  raw: unknown,
): Result<T, AppError> {
  return parseWithSchema(schema, raw);
}
