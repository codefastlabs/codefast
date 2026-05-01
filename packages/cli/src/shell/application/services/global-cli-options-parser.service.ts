import { inject, injectable } from "@codefast/di";
import type { GlobalCliOptions } from "#/shell/application/global-cli-options.model";
import { globalCliCommanderOptionsSchema } from "#/shell/application/global-cli-options.model";
import type { GlobalCliOptionsParsePort } from "#/shell/application/ports/global-cli-options-parse.port";
import type { SchemaValidationPort } from "#/shell/application/ports/schema-validation.port";
import { SchemaValidationPortToken } from "#/shell/application/cli-runtime.tokens";
import type { AppError } from "#/shell/domain/errors.domain";
import type { Result } from "#/shell/domain/result.model";

@injectable([inject(SchemaValidationPortToken)])
export class GlobalCliOptionsParser implements GlobalCliOptionsParsePort {
  constructor(private readonly schemaValidation: SchemaValidationPort) {}

  parseGlobalCliOptions(raw: unknown): Result<GlobalCliOptions, AppError> {
    return this.schemaValidation.parseWithSchema(globalCliCommanderOptionsSchema, raw);
  }
}
