import { injectable } from "@codefast/di";
import { AppError } from "#/shell/domain/errors.domain";
import type { Result } from "#/shell/domain/result.model";
import { err, ok } from "#/shell/domain/result.model";
import type {
  CliSchemaParsing,
  SchemaValidator,
} from "#/shell/application/coordination/cli-schema-parsing.coordination";

/** Implements {@link CliSchemaParsing} — driving-adapter coordination, not outbound to IO. */

type SchemaIssue = {
  readonly path: readonly PropertyKey[];
  readonly message: string;
};

@injectable()
export class SchemaValidationService implements CliSchemaParsing {
  private formatSchemaIssues(issues: readonly SchemaIssue[]): string {
    return issues
      .map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
        return `${path}${issue.message}`;
      })
      .join("; ");
  }

  parseWithSchema<Value>(schema: SchemaValidator<Value>, input: unknown): Result<Value, AppError> {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return err(new AppError("VALIDATION_ERROR", this.formatSchemaIssues(parsed.error.issues)));
    }
    return ok(parsed.data);
  }
}
