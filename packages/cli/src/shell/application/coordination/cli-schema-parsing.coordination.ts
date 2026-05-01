import type { AppError } from "#/shell/domain/errors.domain";
import type { Result } from "#/shell/domain/result.model";

/**
 * Driving-side coordination: validates structured CLI input via schema objects (e.g. Zod).
 * Not a hexagonal secondary port — use cases invoke this only indirectly through parsers/commands.
 */

type SchemaIssue = {
  readonly path: readonly PropertyKey[];
  readonly message: string;
};

type ParseFailure = {
  readonly issues: readonly SchemaIssue[];
};

type ParseSuccess<Value> = {
  readonly success: true;
  readonly data: Value;
};

type ParseError = {
  readonly success: false;
  readonly error: ParseFailure;
};

export type SchemaValidator<Value> = {
  safeParse(input: unknown): ParseSuccess<Value> | ParseError;
};

export interface CliSchemaParsing {
  parseWithSchema<Value>(schema: SchemaValidator<Value>, input: unknown): Result<Value, AppError>;
}
