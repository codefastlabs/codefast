import type { AppError } from "#/shell/domain/errors.domain";
import type { Result } from "#/shell/domain/result.model";

export interface CliExecutorPort {
  consumeCliAppError<T>(
    outcome: Result<T, AppError>,
    options?: { readonly successMessage?: string },
  ): outcome is { readonly ok: true; readonly value: T };

  runCliResultAsync<T>(
    outcomePromise: Promise<Result<T, AppError>>,
    onSuccess: (value: T) => number | void | Promise<number | void>,
  ): Promise<void>;
}
