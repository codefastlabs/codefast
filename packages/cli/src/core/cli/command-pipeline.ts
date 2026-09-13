import process from "node:process";

import type { Command } from "commander";
import type { ZodType } from "zod";

import type { GlobalCliOptions } from "#/core/cli/global-options";
import { globalCliCommanderOptionsSchema } from "#/core/cli/global-options";
import { readOptionalPositionalArg } from "#/core/cli/positional";
import { consumeCliAppError } from "#/core/cli/result-handle";
import type { AppError } from "#/core/errors";
import type { Filesystem } from "#/core/filesystem/filesystem";
import { logger } from "#/core/logger";
import type { Result } from "#/core/result";
import { parseWithSchema } from "#/core/schema-parse";

/**
 * The options every command shares: the `--json` machine-output flag. Per-command option shapes extend this.
 *
 * @since 0.11.0
 */
export interface BaseCommandOptions {
  readonly json?: boolean | undefined;
}

/**
 * A pipeline's `prepare` slot: resolves the argv context (cwd, positional, global options) into the command's prelude.
 *
 * @since 0.11.0
 */
export type CommandPrepare<Prelude> = (
  fs: Filesystem,
  input: {
    readonly currentWorkingDirectory: string;
    readonly rawArg: string | undefined;
    readonly globals: GlobalCliOptions;
  },
) => Promise<Result<Prelude, AppError>>;

/** The prelude and options a request is built from, before the run. */
interface BuildInput<Prelude, Opts> {
  readonly prelude: Prelude;
  readonly opts: Opts;
  readonly globals: GlobalCliOptions;
}

/** The run result and its surrounding context, for the report phase. */
interface ReportInput<Prelude, RunResult, Presenter, Opts> {
  readonly result: RunResult;
  readonly prelude: Prelude;
  readonly opts: Opts;
  readonly presenter: Presenter | undefined;
  readonly elapsedSeconds: number;
}

/**
 * The invariant shape every workspace command and subcommand shares: resolve a prelude, build and
 * validate a request, run it, then report to one of two audiences and record a single exit code.
 *
 * @remarks The optional slots carry the per-command variations — a working-tree guard and a streaming
 * presenter — so the control flow itself is written once.
 *
 * @since 0.11.0
 */
export interface CommandPipeline<
  Prelude,
  Request,
  RunResult,
  Presenter = never,
  Opts extends BaseCommandOptions = BaseCommandOptions,
> {
  readonly name?: string | undefined;
  readonly description?: string | undefined;
  readonly positional?: { readonly name: string; readonly help: string } | undefined;
  readonly jsonHelp?: string | undefined;
  readonly configureArgv?: ((command: Command) => void) | undefined;
  readonly prepare: CommandPrepare<Prelude>;
  readonly guard?:
    | ((input: { readonly prelude: Prelude; readonly opts: Opts }) => Promise<Result<void, AppError>>)
    | undefined;
  readonly schema: ZodType<Request>;
  readonly buildRequest: (input: BuildInput<Prelude, Opts>) => unknown;
  readonly createPresenter?: ((input: BuildInput<Prelude, Opts>) => Presenter) | undefined;
  readonly run: (
    fs: Filesystem,
    request: Request,
    presenter: Presenter | undefined,
  ) => Promise<Result<RunResult, AppError>>;
  readonly presentHuman?: ((input: ReportInput<Prelude, RunResult, Presenter, Opts>) => void) | undefined;
  readonly formatJson: (input: ReportInput<Prelude, RunResult, Presenter, Opts>) => string;
  readonly exitCode: (result: RunResult) => number;
}

/**
 * A pipeline that names itself, so it can register as a subcommand under a parent command.
 *
 * @since 0.11.0
 */
export type NamedCommandPipeline<
  Prelude,
  Request,
  RunResult,
  Presenter = never,
  Opts extends BaseCommandOptions = BaseCommandOptions,
> = CommandPipeline<Prelude, Request, RunResult, Presenter, Opts> & {
  readonly name: string;
  readonly description: string;
};

const DEFAULT_JSON_HELP = "Print one JSON summary on stdout (suppresses human progress)";

function readGlobalOptions(command: Command): Record<string, unknown> {
  return (
    (command.optsWithGlobals?.() as Record<string, unknown> | undefined) ?? (command.opts() as Record<string, unknown>)
  );
}

function makeAction<Prelude, Request, RunResult, Presenter, Opts extends BaseCommandOptions>(
  fs: Filesystem,
  pipeline: CommandPipeline<Prelude, Request, RunResult, Presenter, Opts>,
): (rawArg: string | undefined, opts: Opts, command: Command) => Promise<void> {
  return async (rawArg, opts, command) => {
    const globalsOutcome = parseWithSchema(globalCliCommanderOptionsSchema, readGlobalOptions(command));
    if (!consumeCliAppError(globalsOutcome)) {
      return;
    }
    const globals = globalsOutcome.value;

    const prelude = await pipeline.prepare(fs, {
      currentWorkingDirectory: process.cwd(),
      rawArg: readOptionalPositionalArg(rawArg),
      globals,
    });
    if (!consumeCliAppError(prelude)) {
      return;
    }

    if (pipeline.guard) {
      const guarded = await pipeline.guard({ prelude: prelude.value, opts });
      if (!consumeCliAppError(guarded)) {
        return;
      }
    }

    const parsed = parseWithSchema(pipeline.schema, pipeline.buildRequest({ prelude: prelude.value, opts, globals }));
    if (!consumeCliAppError(parsed)) {
      return;
    }

    const json = !!opts.json;
    const presenter =
      !json && pipeline.createPresenter
        ? pipeline.createPresenter({ prelude: prelude.value, opts, globals })
        : undefined;

    const startedAt = performance.now();
    const outcome = await pipeline.run(fs, parsed.value, presenter);
    if (!consumeCliAppError(outcome)) {
      return;
    }
    const elapsedSeconds = (performance.now() - startedAt) / 1000;

    const report: ReportInput<Prelude, RunResult, Presenter, Opts> = {
      result: outcome.value,
      prelude: prelude.value,
      opts,
      presenter,
      elapsedSeconds,
    };
    if (json) {
      logger.out(pipeline.formatJson(report));
    } else {
      pipeline.presentHuman?.(report);
    }
    process.exitCode = pipeline.exitCode(outcome.value);
  };
}

/**
 * Wires a pipeline onto a named Command: the shared positional, `--json`, any extra options, and the action.
 *
 * @since 0.11.0
 */
export function applyCommandPipeline<Prelude, Request, RunResult, Presenter, Opts extends BaseCommandOptions>(
  command: Command,
  fs: Filesystem,
  pipeline: CommandPipeline<Prelude, Request, RunResult, Presenter, Opts>,
): Command {
  if (pipeline.positional) {
    command.argument(pipeline.positional.name, pipeline.positional.help);
  }
  command.option("--json", pipeline.jsonHelp ?? DEFAULT_JSON_HELP, false);
  pipeline.configureArgv?.(command);
  command.action(makeAction(fs, pipeline));
  return command;
}

/**
 * Registers a pipeline as a subcommand under `parent`, taking its name and description from the pipeline.
 *
 * @since 0.11.0
 */
export function registerPipelineSubcommand<Prelude, Request, RunResult, Presenter, Opts extends BaseCommandOptions>(
  parent: Command,
  fs: Filesystem,
  pipeline: NamedCommandPipeline<Prelude, Request, RunResult, Presenter, Opts>,
): void {
  applyCommandPipeline(parent.command(pipeline.name).description(pipeline.description), fs, pipeline);
}
