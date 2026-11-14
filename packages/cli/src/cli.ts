import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { Command, CommanderError } from "commander";

import { createAuditCommands } from "#audit/command";
import { createCommand } from "#core/command";
import { CLI_EXIT_ERROR, CLI_EXIT_SUCCESS } from "#core/exit-codes";
import { refuseColor } from "#core/style";
import { exportsGenerateCommand } from "#exports/command";
import { publishPrepareCommand } from "#publish/command";
import { sinceStampCommand } from "#since/command";

function readVersion(): string {
  try {
    const dir = path.dirname(fileURLToPath(import.meta.url));
    const pkgPath = path.join(dir, "..", "package.json");
    const raw = readFileSync(pkgPath, "utf-8");
    const pkgVersion = (JSON.parse(raw) as { version?: unknown }).version;
    return typeof pkgVersion === "string" && pkgVersion.length > 0 ? pkgVersion : "unknown";
  } catch {
    return "unknown";
  }
}

// Commander exits on its own for usage errors; route every command's exit through a throw so `runCli` owns the code.
function throwInsteadOfExiting(command: Command): void {
  command.exitOverride();
  for (const subcommand of command.commands) {
    throwInsteadOfExiting(subcommand);
  }
}

/**
 * Runs the `codefast` CLI over the given argv and returns the process exit code.
 *
 * @since 0.3.16-canary.0
 */
export async function runCli(argv: Array<string>): Promise<number> {
  const program = new Command();
  program
    .name("codefast")
    .description("Codefast monorepo developer CLI")
    .version(readVersion())
    .option("--no-color", "Disable ANSI color output")
    // Required so options after a subcommand bind to that subcommand rather than
    // the program — e.g. `audit:links <target> --json`.
    .enablePositionalOptions()
    .configureHelp({ sortSubcommands: true })
    .showHelpAfterError("(use --help for usage)");

  for (const command of [
    ...createAuditCommands(),
    createCommand(exportsGenerateCommand),
    createCommand(publishPrepareCommand),
    createCommand(sinceStampCommand),
  ]) {
    program.addCommand(command);
  }

  program.hook("preAction", () => {
    refuseColor(program.opts()["color"] === false);
  });
  throwInsteadOfExiting(program);

  // Run bare, the CLI lists its commands, as `php artisan` does.
  if (argv.length <= 2) {
    program.outputHelp();
    return CLI_EXIT_SUCCESS;
  }

  try {
    await program.parseAsync(argv, { from: "node" });
  } catch (caughtError: unknown) {
    if (!(caughtError instanceof CommanderError)) {
      throw caughtError;
    }
    // Help and version exit 0; every other Commander exit is a usage error it has already printed.
    process.exitCode = caughtError.exitCode === 0 ? CLI_EXIT_SUCCESS : CLI_EXIT_ERROR;
  }
  const code = process.exitCode ?? 0;
  return typeof code === "number" ? code : Number(code) || 0;
}
