import type { z } from "zod";
import { parseWithSchema } from "#lib/core/application/schema-parse.util";
import type { AppError } from "#lib/core/domain/errors.domain";
import type { Result } from "#lib/core/domain/result.model";

export function parseWithCliSchema<T>(schema: z.ZodType<T>, raw: unknown): Result<T, AppError> {
  return parseWithSchema(schema, raw);
}
