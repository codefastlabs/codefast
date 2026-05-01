import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { createCliRuntimeContainer, resolveCliCommands } from "#/bootstrap/composition-root";
import { CommanderCliHostAdapter } from "#/shell/adapters/commander/commander-cli-host.adapter";
import type { CliCommandPort } from "#/shell/application/ports/primary/cli-command.port";

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

function createProgram(commands: readonly CliCommandPort[]): Command {
  const program = new Command();
  program
    .name("codefast")
    .description("Codefast monorepo developer CLI")
    .version(readVersion())
    .option("--no-color", "Disable ANSI color output")
    .configureHelp({ sortSubcommands: true })
    .showHelpAfterError("(use --help for usage)");

  CommanderCliHostAdapter.registerTrees(
    program,
    commands.map((cliEntry) => cliEntry.definition),
  );

  return program;
}

export async function runCli(argv: string[]): Promise<number> {
  const runtimeContainer = createCliRuntimeContainer();
  try {
    if (process.env.NODE_ENV !== "production") {
      runtimeContainer.validate();
      await runtimeContainer.initializeAsync();
    }
    const commands = resolveCliCommands(runtimeContainer);
    const program = createProgram(commands);
    await program.parseAsync(argv, { from: "node" });
    const code = process.exitCode ?? 0;
    return typeof code === "number" ? code : Number(code) || 0;
  } finally {
    await runtimeContainer.dispose();
  }
}
