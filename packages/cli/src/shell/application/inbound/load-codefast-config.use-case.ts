import type { CodefastConfig } from "#/domains/config/domain/schema.domain";
import type { AppError } from "#/shell/domain/errors.domain";
import type { Result } from "#/shell/domain/result.model";

export interface LoadCodefastConfigUseCase {
  execute(rootDir: string): Promise<Result<{ config: CodefastConfig }, AppError>>;
}
