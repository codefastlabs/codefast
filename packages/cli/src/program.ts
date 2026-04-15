import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { registerArrangeCommand } from "#commands/arrange";
import { registerMirrorCommand } from "#commands/mirror";
import { registerTagCommand } from "#commands/tag";
import { createCliRuntimeContainer } from "#lib/core/infra/composition-root";

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

export function createProgram(): Command {
  const program = new Command();
  program
    .name("codefast")
    .description("Codefast monorepo developer CLI")
    .version(readVersion())
    .option("--no-color", "Disable ANSI color output")
    .configureHelp({ sortSubcommands: true })
    .showHelpAfterError("(use --help for usage)");

  registerMirrorCommand(program);
  registerArrangeCommand(program);
  registerTagCommand(program);

  return program;
}

export async function runCli(argv: string[]): Promise<number> {
  if (process.env.NODE_ENV !== "production") {
    const runtimeContainer = createCliRuntimeContainer();
    runtimeContainer.validate();
    runtimeContainer.initialize();
    runtimeContainer.disposeSync();
  }
  const program = createProgram();
  await program.parseAsync(argv, { from: "node" });
  const code = process.exitCode ?? 0;
  return typeof code === "number" ? code : Number(code) || 0;
}
