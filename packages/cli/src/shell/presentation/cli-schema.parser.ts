import type { SchemaValidator } from "#/shell/application/services/schema-validator.service";
import { parseWithSchema } from "#/shell/application/services/schema-validator.service";
import type { AppError } from "#/shell/domain/errors.domain";
import type { Result } from "#/shell/domain/result.model";

export function parseWithCliSchema<T>(
  schema: SchemaValidator<T>,
  raw: unknown,
): Result<T, AppError> {
  return parseWithSchema(schema, raw);
}
