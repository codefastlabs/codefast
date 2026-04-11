import path from "node:path";
import process from "node:process";
import { Command } from "commander";
import { normalizePath, runMirrorSync } from "#lib/mirror";
import { findRepoRoot } from "#lib/repo-root";

function packageArgToRelative(rootDir: string, arg: string | undefined): string | undefined {
  if (!arg) return undefined;
  const resolved = path.resolve(process.cwd(), arg);
  const rel = path.relative(rootDir, resolved);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Package path must be under monorepo root: ${rootDir}`);
  }
  return normalizePath(rel);
}

export function registerMirrorCommand(program: Command): void {
  const mirror = program
    .command("mirror")
    .description("Keep package manifests aligned with what you ship");

  mirror
    .command("sync")
    .description("Write package.json exports from dist/ for workspace packages")
    .argument("[package]", "Optional package path relative to repo root (e.g. packages/ui)")
    .option("-v, --verbose", "Print extra diagnostics", false)
    .action(async function (
      this: Command,
      pkg: string | undefined,
      options: { verbose?: boolean },
    ) {
      const globals = this.optsWithGlobals() as { color?: boolean };
      const rootDir = findRepoRoot();
      let packageFilter: string | undefined;
      try {
        packageFilter = packageArgToRelative(rootDir, pkg);
      } catch (e) {
        this.error(e instanceof Error ? e.message : String(e));
        return;
      }
      const exitCode = await runMirrorSync({
        rootDir,
        verbose: options.verbose,
        /** Commander sets `color: false` when `--no-color` is passed (default `color: true`). */
        noColor: globals.color === false,
        packageFilter,
      });
      process.exitCode = exitCode;
    });
}
