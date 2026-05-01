import type { GlobalCliOptions } from "#/shell/application/global-cli-options.model";
import type { AppError } from "#/shell/domain/errors.domain";
import type { Result } from "#/shell/domain/result.model";

export interface GlobalCliOptionsParsePort {
  parseGlobalCliOptions(raw: unknown): Result<GlobalCliOptions, AppError>;
}
