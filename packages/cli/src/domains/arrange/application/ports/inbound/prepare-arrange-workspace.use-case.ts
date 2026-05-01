import type { ArrangeTargetWorkspaceAndConfig } from "#/domains/arrange/contracts/models";
import type { AppError } from "#/shell/domain/errors.domain";
import type { Result } from "#/shell/domain/result.model";

export interface PrepareArrangeWorkspaceUseCasePort {
  execute(args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  }): Promise<Result<ArrangeTargetWorkspaceAndConfig, AppError>>;
}
