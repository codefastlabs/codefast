import { inject, injectable } from "@codefast/di";
import type { GlobalCliOptions } from "#/shell/application/global-cli-options.model";
import { globalCliCommanderOptionsSchema } from "#/shell/application/global-cli-options.model";
import type { GlobalCliOptionsParsePort } from "#/shell/application/outbound/global-cli-options-parse.outbound-port";
import type { CliSchemaParsing } from "#/shell/application/coordination/cli-schema-parsing.coordination";
import { CliSchemaParsingToken } from "#/shell/application/cli-runtime.tokens";
import type { AppError } from "#/shell/domain/errors.domain";
import type { Result } from "#/shell/domain/result.model";

@injectable([inject(CliSchemaParsingToken)])
export class GlobalCliOptionsParser implements GlobalCliOptionsParsePort {
  constructor(private readonly schemaValidation: CliSchemaParsing) {}

  parseGlobalCliOptions(raw: unknown): Result<GlobalCliOptions, AppError> {
    return this.schemaValidation.parseWithSchema(globalCliCommanderOptionsSchema, raw);
  }
}
