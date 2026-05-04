import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { createArrangeCommand } from "#/arrange/command";
import { createMirrorCommand } from "#/mirror/command";
import { createTagCommand } from "#/tag/command";

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

export async function runCli(argv: string[]): Promise<number> {
  const program = new Command();
  program
    .name("codefast")
    .description("Codefast monorepo developer CLI")
    .version(readVersion())
    .option("--no-color", "Disable ANSI color output")
    .configureHelp({ sortSubcommands: true })
    .showHelpAfterError("(use --help for usage)");

  program.addCommand(createArrangeCommand());
  program.addCommand(createMirrorCommand());
  program.addCommand(createTagCommand());

  await program.parseAsync(argv, { from: "node" });
  const code = process.exitCode ?? 0;
  return typeof code === "number" ? code : Number(code) || 0;
}
