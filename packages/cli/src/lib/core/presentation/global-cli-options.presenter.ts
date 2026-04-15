import { z } from "zod";
import { parseWithSchema } from "#lib/core/application/schema-parse.util";
import type { AppError } from "#lib/core/domain/errors.domain";
import type { Result } from "#lib/core/domain/result.model";

export const globalCliOptionsSchema = z.object({
  color: z.boolean().optional(),
});

export type GlobalCliOptions = z.infer<typeof globalCliOptionsSchema>;

export function parseGlobalCliOptions(raw: unknown): Result<GlobalCliOptions, AppError> {
  return parseWithSchema(globalCliOptionsSchema, raw);
}
