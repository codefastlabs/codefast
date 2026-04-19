import type { CodefastConfig } from "#/lib/config/domain/schema.domain";
import type { AppError } from "#/lib/core/domain/errors.domain";
import type { Result } from "#/lib/core/domain/result.model";

export interface TryLoadCodefastConfigPresenter {
  execute(rootDir: string): Promise<Result<{ config: CodefastConfig }, AppError>>;
}
