import type { ZodType } from "zod";
import { AppError } from "#/core/errors";
import type { Result } from "#/core/result";
import { err, ok } from "#/core/result";

type SchemaIssue = {
  readonly path: readonly PropertyKey[];
  readonly message: string;
};

function formatSchemaIssues(issues: readonly SchemaIssue[]): string {
  return issues
    .map((issue) => {
      const pathLabel = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
      return `${pathLabel}${issue.message}`;
    })
    .join("; ");
}

/**
 * @since 0.3.16-canary.0
 */
export function parseWithSchema<Value>(
  schema: ZodType<Value>,
  input: unknown,
): Result<Value, AppError> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return err(new AppError("VALIDATION_ERROR", formatSchemaIssues(parsed.error.issues)));
  }
  return ok(parsed.data);
}
