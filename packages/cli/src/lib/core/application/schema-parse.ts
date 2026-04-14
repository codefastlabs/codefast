import { z } from "zod";
import { appError, type AppError } from "#lib/core/domain/errors";
import { err, ok, type Result } from "#lib/core/domain/result";

function formatZodIssues(issues: z.ZodIssue[]): string {
  return issues
    .map((issue) => {
      const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
      return `${path}${issue.message}`;
    })
    .join("; ");
}

/**
 * Validates `input` with `schema`, returning {@link AppError} with code `VALIDATION_ERROR` on failure.
 */
export function parseWithSchema<T>(schema: z.ZodType<T>, input: unknown): Result<T, AppError> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return err(appError("VALIDATION_ERROR", formatZodIssues(parsed.error.issues)));
  }
  return ok(parsed.data);
}
