import process from "node:process";
import type { z } from "zod";
import { parseWithSchema } from "#lib/core/application/schema-parse";
import { messageFromCaughtUnknown } from "#lib/core/application/utils/caught-unknown-message";
import { appError, type AppError } from "#lib/core/domain/errors";
import { err, ok, type Result } from "#lib/core/domain/result";
import { createCliContainer, type CliContainer } from "#lib/core/infra/container";
import { consumeCliAppError, runCliResultAsync } from "#lib/core/presentation/cli-executor";
import { loadConfig } from "#lib/config";
import type { CodefastConfig } from "#lib/config";
import { printConfigSchemaWarnings } from "#lib/infra/config-reporter";
import { findRepoRoot } from "#lib/infra/workspace/repo-root";

export function createCliContext(): CliContainer {
  return createCliContainer();
}

export function resolveWorkspaceRoot(cli: CliContainer): Result<string, AppError> {
  try {
    return ok(findRepoRoot(cli.fs));
  } catch (caughtError: unknown) {
    return err(appError("INFRA_FAILURE", messageFromCaughtUnknown(caughtError), caughtError));
  }
}

/**
 * Like {@link resolveWorkspaceRoot}, but falls back to `process.cwd()` when repo root detection throws (tag UX).
 */
export function resolveTagWorkspaceRoot(cli: CliContainer): string {
  try {
    return findRepoRoot(cli.fs);
  } catch (caughtRepoRootError: unknown) {
    cli.logger.out(
      `[tag] workspace root auto-detection failed (${messageFromCaughtUnknown(caughtRepoRootError)}), using cwd=${process.cwd()}`,
    );
    return process.cwd();
  }
}

export async function tryLoadCodefastConfig(
  cli: CliContainer,
  rootDir: string,
): Promise<Result<{ config: CodefastConfig }, AppError>> {
  try {
    const { config, warnings } = await loadConfig(cli.fs, rootDir);
    printConfigSchemaWarnings(cli.logger, warnings);
    return ok({ config });
  } catch (caughtError: unknown) {
    return err(appError("INFRA_FAILURE", messageFromCaughtUnknown(caughtError), caughtError));
  }
}

export function assertPathExistsOrExit(resolvedPath: string, cli: CliContainer): boolean {
  if (!cli.fs.existsSync(resolvedPath)) {
    cli.logger.err(`Not found: ${resolvedPath}`);
    process.exitCode = 1;
    return false;
  }
  return true;
}

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

export function parseWithCliSchema<T>(schema: z.ZodType<T>, raw: unknown): Result<T, AppError> {
  return parseWithSchema(schema, raw);
}

export type { CliContainer };
