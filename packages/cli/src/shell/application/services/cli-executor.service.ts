import process from "node:process";
import { inject, injectable } from "@codefast/di";
import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_USAGE } from "#/shell/domain/cli-exit-codes.domain";
import type { AppError } from "#/shell/domain/errors.domain";
import type { Result } from "#/shell/domain/result.model";
import type { CliLoggerPort } from "#/shell/application/ports/outbound/cli-logger.port";
import type { CliExecutor } from "#/shell/application/coordination/cli-executor.coordination";
import type { CliVerboseDiagnosticsPort } from "#/shell/application/ports/outbound/cli-verbose-diagnostics.port";
import type { FormatAppErrorPort } from "#/shell/application/ports/outbound/format-app-error.port";
import {
  CliLoggerPortToken,
  CliVerboseDiagnosticsPortToken,
  FormatAppErrorPortToken,
} from "#/shell/application/cli-runtime.tokens";

@injectable([
  inject(FormatAppErrorPortToken),
  inject(CliVerboseDiagnosticsPortToken),
  inject(CliLoggerPortToken),
])
export class CliExecutorService implements CliExecutor {
  constructor(
    private readonly formatAppError: FormatAppErrorPort,
    private readonly verboseDiagnostics: CliVerboseDiagnosticsPort,
    private readonly logger: CliLoggerPort,
  ) {}

  private assertExhaustiveAppErrorCode(code: never): number {
    return code;
  }

  private exitCodeForAppError(error: AppError): number {
    const { code } = error;
    switch (code) {
      case "NOT_FOUND":
        return CLI_EXIT_GENERAL_ERROR;
      case "VALIDATION_ERROR":
        return CLI_EXIT_USAGE;
      case "INFRA_FAILURE":
        return CLI_EXIT_GENERAL_ERROR;
      default:
        return this.assertExhaustiveAppErrorCode(code);
    }
  }

  consumeCliAppError<T>(
    outcome: Result<T, AppError>,
    options?: { readonly successMessage?: string },
  ): outcome is { readonly ok: true; readonly value: T } {
    if (!outcome.ok) {
      this.logger.err(this.formatAppError.format(outcome.error));
      if (
        this.verboseDiagnostics.isVerboseCliDiagnostics() &&
        outcome.error.code === "INFRA_FAILURE" &&
        outcome.error.cause instanceof Error &&
        outcome.error.cause.stack !== undefined
      ) {
        this.logger.err(outcome.error.cause.stack);
      }
      process.exitCode = this.exitCodeForAppError(outcome.error);
      return false;
    }
    if (options?.successMessage !== undefined) {
      this.logger.out(options.successMessage);
    }
    return true;
  }

  async runCliResultAsync<T>(
    outcomePromise: Promise<Result<T, AppError>>,
    onSuccess: (value: T) => number | void | Promise<number | void>,
  ): Promise<void> {
    const outcome = await outcomePromise;
    if (!this.consumeCliAppError(outcome)) {
      return;
    }
    const exit = await onSuccess(outcome.value);
    process.exitCode = exit === undefined ? 0 : exit;
  }
}
