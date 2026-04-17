import { appError, type AppError } from "#/lib/core/domain/errors.domain";
import { err, ok, type Result } from "#/lib/core/domain/result.model";

type SchemaIssue = {
  readonly path: readonly PropertyKey[];
  readonly message: string;
};

type ParseFailure = {
  readonly issues: readonly SchemaIssue[];
};

type ParseSuccess<T> = {
  readonly success: true;
  readonly data: T;
};

type ParseError = {
  readonly success: false;
  readonly error: ParseFailure;
};

export type SchemaValidator<T> = {
  safeParse(input: unknown): ParseSuccess<T> | ParseError;
};

function formatSchemaIssues(issues: readonly SchemaIssue[]): string {
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
export function parseWithSchema<T>(
  schema: SchemaValidator<T>,
  input: unknown,
): Result<T, AppError> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return err(appError("VALIDATION_ERROR", formatSchemaIssues(parsed.error.issues)));
  }
  return ok(parsed.data);
}
