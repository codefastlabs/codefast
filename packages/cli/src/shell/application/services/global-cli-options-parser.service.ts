import { z } from "zod";
import { parseWithSchema } from "#/shell/application/services/schema-validator.service";
import type { AppError } from "#/shell/domain/errors.domain";
import type { Result } from "#/shell/domain/result.model";

const globalCliOptionsSchema = z.object({
  color: z.boolean().optional(),
});

export type GlobalCliOptions = z.infer<typeof globalCliOptionsSchema>;

export function parseGlobalCliOptions(raw: unknown): Result<GlobalCliOptions, AppError> {
  return parseWithSchema(globalCliOptionsSchema, raw);
}
