import type { AppError } from "#lib/core/domain/errors.domain";
import type { Result } from "#lib/core/domain/result.model";
import type { CliContainer } from "#lib/core/infra/container.adapter";
import {
  consumeCliAppError,
  runCliResultAsync,
} from "#lib/core/presentation/cli-executor.presenter";

export function runSyncUseCaseAfterParse<T, R>(
  cli: CliContainer,
  parsed: Result<T, AppError>,
  execute: (input: T) => Result<R, AppError>,
  onSuccess: (output: R) => void,
): void {
  if (!consumeCliAppError(cli.logger, parsed)) {
    return;
  }
  const outcome = execute(parsed.value);
  if (!consumeCliAppError(cli.logger, outcome)) {
    return;
  }
  onSuccess(outcome.value);
}

export async function runAsyncExitCodeUseCaseAfterParse<T>(
  cli: CliContainer,
  parsed: Result<T, AppError>,
  execute: (input: T) => Promise<Result<number, AppError>>,
): Promise<void> {
  if (!consumeCliAppError(cli.logger, parsed)) {
    return;
  }
  await runCliResultAsync(cli.logger, execute(parsed.value), (code) => code);
}
