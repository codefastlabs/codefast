import process from "node:process";

import { Command } from "commander";

import type { CodefastConfig } from "#core/config/schema";
import type { AppError } from "#core/errors";
import { messageFrom } from "#core/errors";
import { CLI_EXIT_ERROR, CLI_EXIT_FAILURE, CLI_EXIT_SUCCESS } from "#core/exit-codes";
import type { Filesystem } from "#core/filesystem/filesystem";
import { nodeFilesystem } from "#core/filesystem/node";
import { logger } from "#core/logger";
import type { Result } from "#core/result";
import { paint } from "#core/style";
import type { Target } from "#core/target";
import { resolveTarget } from "#core/target";
import type { Workspace } from "#core/workspace/workspace";
import { loadWorkspace } from "#core/workspace/workspace";

/**
 * The version of the `--json` document every command prints.
 */
const JSON_SCHEMA_VERSION = 3;

/**
 * How a report ends its run: it passed, it reports a failure, or the run could not do its job.
 */
export type Verdict = "pass" | "fail" | "error";

/**
 * What a command's run receives: the project, what it acts on, and the flags it declared.
 */
export interface CommandContext<Flag extends string = never> {
  readonly fs: Filesystem;
  readonly workspace: Workspace;
  readonly target: Target;
  /** Whether the command line named the target, rather than a default standing in for it. */
  readonly targetGiven: boolean;
  readonly currentWorkingDirectory: string;
  readonly flags: Readonly<Record<Flag, boolean>>;
  /** Whether `--verbose` asked for the stack trace behind an unexpected failure. */
  readonly verbose: boolean;
}

/**
 * The context a report is presented in: the run's, and how long the run took.
 */
export interface ReportContext<Flag extends string = never> extends CommandContext<Flag> {
  readonly elapsedSeconds: number;
}

/**
 * A `codefast` command: its name and target, the flags it takes, its run, and how its report reads.
 *
 * @remarks Every command shares the rest — the project and target resolution, `--json` and `--verbose`, error
 * reporting, the `afterWrite` hook and the exit code — so no command writes any of it.
 */
export interface CommandSpec<Report, Flag extends string = never> {
  readonly name: string;
  readonly description: string;
  readonly targetHelp: string;
  /** Boolean flags by camelCase name, each spelled `--kebab-case` on the command line, with their help. */
  readonly flags?: Readonly<Record<Flag, string>> | undefined;
  /** The target the config names for this command, used when the command line names none. */
  readonly configuredTarget?: ((config: CodefastConfig) => string | undefined) | undefined;
  readonly run: (context: CommandContext<Flag>) => Promise<Result<Report, AppError>>;
  readonly verdict: (report: Report) => Verdict;
  readonly present: (report: Report, context: ReportContext<Flag>) => void;
  /** The absolute paths the run wrote, handed to the `afterWrite` hook. */
  readonly writtenFiles?: ((report: Report, context: CommandContext<Flag>) => ReadonlyArray<string>) | undefined;
}

const exitCodes: Readonly<Record<Verdict, number>> = {
  pass: CLI_EXIT_SUCCESS,
  fail: CLI_EXIT_FAILURE,
  error: CLI_EXIT_ERROR,
};

function flagSpelling(flag: string): string {
  return `--${flag.replaceAll(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
}

function readFlags<Flag extends string>(
  declared: Readonly<Record<Flag, string>> | undefined,
  options: Readonly<Record<string, unknown>>,
): Readonly<Record<Flag, boolean>> {
  const names = Object.keys(declared ?? {}) as Array<Flag>;
  return Object.fromEntries(names.map((name) => [name, options[name] === true])) as Record<Flag, boolean>;
}

/**
 * Derives a context for a command run on behalf of another, resolving the target its own config names when the
 * command line named none.
 */
export function deriveContext<Flag extends string>(
  parent: CommandContext<string>,
  configuredTarget: ((config: CodefastConfig) => string | undefined) | undefined,
  flags: Readonly<Record<Flag, boolean>>,
): Result<CommandContext<Flag>, AppError> {
  const target = parent.targetGiven
    ? { ok: true as const, value: parent.target }
    : resolveTarget(parent.fs, {
        rootDir: parent.workspace.rootDir,
        currentWorkingDirectory: parent.currentWorkingDirectory,
        given: undefined,
        configured: configuredTarget?.(parent.workspace.config),
      });
  return target.ok ? { ok: true, value: { ...parent, target: target.value, flags } } : target;
}

// Prints an error on stderr as `[CODE] message`, with the stack behind it when `verbose` asks for it.
function presentAppError(error: AppError, verbose: boolean): void {
  logger.err(paint("red", `[${error.code}] ${error.message}`, process.stderr));
  if (verbose && error.cause instanceof Error && error.cause.stack !== undefined) {
    logger.err(error.cause.stack);
  }
}

function reportError(command: string, error: AppError, options: { json: boolean; verbose: boolean }): void {
  if (options.json) {
    const { code, message } = error;
    logger.out(JSON.stringify({ schemaVersion: JSON_SCHEMA_VERSION, command, ok: false, error: { code, message } }));
  } else {
    presentAppError(error, options.verbose);
  }
}

async function runAfterWrite(
  config: CodefastConfig,
  command: string,
  files: ReadonlyArray<string>,
): Promise<string | null> {
  if (config.afterWrite === undefined || files.length === 0) {
    return null;
  }
  try {
    await config.afterWrite({ command, files });
    return null;
  } catch (caughtError: unknown) {
    return messageFrom(caughtError);
  }
}

async function execute<Report, Flag extends string>(
  spec: CommandSpec<Report, Flag>,
  fs: Filesystem,
  givenTarget: string | undefined,
  options: Readonly<Record<string, unknown>>,
): Promise<number> {
  const output = { json: options.json === true, verbose: options.verbose === true };
  const startedAt = performance.now();
  const currentWorkingDirectory = process.cwd();

  const workspace = await loadWorkspace(fs, currentWorkingDirectory);
  if (!workspace.ok) {
    reportError(spec.name, workspace.error, output);
    return CLI_EXIT_ERROR;
  }
  const target = resolveTarget(fs, {
    rootDir: workspace.value.rootDir,
    currentWorkingDirectory,
    given: givenTarget,
    configured: spec.configuredTarget?.(workspace.value.config),
  });
  if (!target.ok) {
    reportError(spec.name, target.error, output);
    return CLI_EXIT_ERROR;
  }

  const context: CommandContext<Flag> = {
    fs,
    workspace: workspace.value,
    target: target.value,
    targetGiven: givenTarget !== undefined,
    currentWorkingDirectory,
    flags: readFlags(spec.flags, options),
    verbose: output.verbose,
  };
  const outcome = await spec.run(context);
  if (!outcome.ok) {
    reportError(spec.name, outcome.error, output);
    return CLI_EXIT_ERROR;
  }
  const report = outcome.value;
  const hookError = await runAfterWrite(workspace.value.config, spec.name, spec.writtenFiles?.(report, context) ?? []);
  const elapsedSeconds = (performance.now() - startedAt) / 1000;

  let verdict = spec.verdict(report);
  if (hookError !== null && verdict === "pass") {
    verdict = "fail";
  }
  if (output.json) {
    logger.out(
      JSON.stringify({
        schemaVersion: JSON_SCHEMA_VERSION,
        command: spec.name,
        ok: verdict === "pass",
        rootDir: context.workspace.rootDir,
        target: context.target.relativePath,
        elapsedSeconds,
        ...(hookError === null ? {} : { hookError }),
        result: report,
      }),
    );
  } else {
    spec.present(report, { ...context, elapsedSeconds });
    if (hookError !== null) {
      logger.err(paint("red", `✗ The afterWrite hook failed: ${hookError}`, process.stderr));
    }
  }
  return exitCodes[verdict];
}

/**
 * Creates the Commander command for a spec, wiring `[target]`, `--json`, `--verbose` and its own flags.
 */
export function createCommand<Report, Flag extends string>(
  spec: CommandSpec<Report, Flag>,
  fs: Filesystem = nodeFilesystem,
): Command {
  const command = new Command(spec.name)
    .description(spec.description)
    .argument("[target]", spec.targetHelp)
    .option("--json", "Print one JSON document on stdout instead of the human-readable report")
    .option("-v, --verbose", "Print the stack trace behind an unexpected failure");
  for (const [flag, help] of Object.entries<string>(spec.flags ?? {})) {
    command.option(flagSpelling(flag), help);
  }
  command.action(async (givenTarget: string | undefined, options: Record<string, unknown>) => {
    process.exitCode = await execute(spec, fs, givenTarget, options);
  });
  return command;
}
