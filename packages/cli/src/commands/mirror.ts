import { realpathSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { Command } from "commander";
import { messageFromCaughtUnknown } from "#lib/infra/caught-unknown-message";
import { loadConfig } from "#lib/config/loader";
import { printConfigSchemaWarnings } from "#lib/infra/config-reporter";
import { createNodeCliFs, createNodeCliLogger } from "#lib/infra/node-io";
import { runMirrorSync } from "#lib/mirror/sync";
import { findRepoRoot } from "#lib/repo-root";

function tryRealpath(entryPath: string): string {
  try {
    return realpathSync.native(entryPath);
  } catch {
    return path.resolve(entryPath);
  }
}

function normalizePath(relPath: string): string {
  return relPath.split(path.sep).join("/").replace(/\\/g, "/");
}

export function packageArgToRelative(rootDir: string, arg: string | undefined): string | undefined {
  if (!arg) return undefined;
  const rootReal = tryRealpath(path.resolve(rootDir));
  const cwdReal = tryRealpath(process.cwd());
  const resolved = path.isAbsolute(arg) ? path.resolve(arg) : path.resolve(cwdReal, arg);
  const targetReal = tryRealpath(resolved);
  const rel = path.relative(rootReal, targetReal);
  const normalized = normalizePath(rel);
  if (
    normalized.startsWith("..") ||
    path.isAbsolute(normalized) ||
    normalized === "" ||
    normalized === "."
  ) {
    throw new Error(`Package path must be a subdirectory under monorepo root: ${rootDir}`);
  }
  return normalized;
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
      const fs = createNodeCliFs();
      const logger = createNodeCliLogger();
      const rootDir = findRepoRoot(fs);
      let packageFilter: string | undefined;
      try {
        packageFilter = packageArgToRelative(rootDir, pkg);
      } catch (caughtPathError: unknown) {
        this.error(messageFromCaughtUnknown(caughtPathError));
        return;
      }
      let mirrorConfig = {};
      try {
        const { config, warnings } = await loadConfig(fs, rootDir);
        printConfigSchemaWarnings(logger, warnings);
        mirrorConfig = config.mirror ?? {};
      } catch (caughtConfigError: unknown) {
        this.error(messageFromCaughtUnknown(caughtConfigError));
        return;
      }
      const exitCode = await runMirrorSync({
        rootDir,
        config: mirrorConfig,
        verbose: options.verbose,
        /** Commander sets `color: false` when `--no-color` is passed (default `color: true`). */
        noColor: globals.color === false,
        packageFilter,
        fs,
        logger,
      });
      process.exitCode = exitCode;
    });
}
