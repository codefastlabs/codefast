import type { AppError } from "#/shell/domain/errors.domain";
import type { Result } from "#/shell/domain/result.model";

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

export interface SchemaValidationPort {
  parseWithSchema<Value>(schema: SchemaValidator<Value>, input: unknown): Result<Value, AppError>;
}
