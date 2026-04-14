import { realpathSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { Command } from "commander";
import { messageFromCaughtUnknown } from "#lib/core/application/utils/caught-unknown-message";
import { consumeCliAppError } from "#lib/core/presentation/cli-executor";
import {
  createCliContext,
  parseWithCliSchema,
  resolveWorkspaceRoot,
  runAsyncExitCodeUseCaseAfterParse,
  tryLoadCodefastConfig,
} from "#lib/core/presentation/create-command-handler";
import { MirrorSyncRunRequestSchema } from "#lib/mirror/application/requests/mirror-sync.request";

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
  if (!arg) {
    return undefined;
  }
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
      const cli = createCliContext();
      const rootOutcome = resolveWorkspaceRoot(cli);
      if (!consumeCliAppError(cli.logger, rootOutcome)) {
        return;
      }
      const rootDir = rootOutcome.value;
      let packageFilter: string | undefined;
      try {
        packageFilter = packageArgToRelative(rootDir, pkg);
      } catch (caughtPathError: unknown) {
        this.error(messageFromCaughtUnknown(caughtPathError));
        return;
      }
      const loadedOutcome = await tryLoadCodefastConfig(cli, rootDir);
      if (!consumeCliAppError(cli.logger, loadedOutcome)) {
        return;
      }
      const parsed = parseWithCliSchema(MirrorSyncRunRequestSchema, {
        rootDir,
        config: loadedOutcome.value.config.mirror ?? {},
        verbose: options.verbose,
        noColor: globals.color === false,
        packageFilter,
      });
      await runAsyncExitCodeUseCaseAfterParse(cli, parsed, (input) =>
        cli.mirror.runMirrorSync(input),
      );
    });
}
