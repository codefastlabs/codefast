import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { registerExportsCommand } from "#commands/exports";
import { registerTailwindCnCommand } from "#commands/tailwind-cn";

function readVersion(): string {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const pkgPath = path.join(dir, "..", "package.json");
  return JSON.parse(readFileSync(pkgPath, "utf-8")).version as string;
}

export function createProgram(): Command {
  const program = new Command();
  program
    .name("codefast")
    .description("Codefast monorepo developer CLI")
    .version(readVersion())
    .option("--no-color", "Disable ANSI color output")
    .configureHelp({ sortSubcommands: true })
    .showHelpAfterError("(use --help for usage)");

  registerExportsCommand(program);
  registerTailwindCnCommand(program);

  return program;
}

export async function runCli(argv: string[]): Promise<number> {
  const program = createProgram();
  await program.parseAsync(argv, { from: "node" });
  const code = process.exitCode ?? 0;
  return typeof code === "number" ? code : Number(code) || 0;
}
