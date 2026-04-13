import path from "node:path";
import process from "node:process";
import type { Command } from "commander";
import { Option } from "commander";
import type { CliFs, CliLogger } from "#lib/infra/fs-contract";
import { loadConfig } from "#lib/shared/config-loader";
import type { CodefastConfig } from "#lib/shared/config-types";
import {
  ArrangeError,
  ArrangeErrorCode,
  type ArrangeRunResult,
  analyzeDirectory,
  createNodeCliFs,
  createNodeCliLogger,
  DEFAULT_ARRANGE_TARGET,
  formatArray,
  formatCnCall,
  printAnalyzeReport,
  runOnTarget,
  suggestCnGroups,
  summarizeGroupBucketLabels,
} from "#lib/arrange";

/** Commander attribute `withClassName` (second long flag `--with-class-name`). */
function createWithClassNameOption(): Option {
  return new Option(
    "--with-classname, --with-class-name",
    "Append className as final cn() argument",
  ).default(false);
}

function defaultTargetPath(): string {
  return path.resolve(process.cwd(), DEFAULT_ARRANGE_TARGET);
}

function checkTargetExists(resolved: string, fs: CliFs, logger: CliLogger): boolean {
  if (!fs.existsSync(resolved)) {
    logger.err(`Not found: ${resolved}`);
    process.exitCode = 1;
    return false;
  }
  return true;
}

function handleArrangeLibError(e: unknown, logger: CliLogger): boolean {
  if (e instanceof ArrangeError && e.code === ArrangeErrorCode.TARGET_NOT_FOUND) {
    logger.err(e.message);
    process.exitCode = 1;
    return true;
  }
  return false;
}

type ArrangeCliRunOpts = {
  write: boolean;
  withClassName?: boolean;
  cnImport?: string;
};

async function loadCodefastConfigWithWarnings(
  fs: CliFs,
  logger: CliLogger,
): Promise<CodefastConfig | undefined> {
  const { config, warnings } = await loadConfig(fs);
  for (const warning of warnings) {
    logger.err(`[config] ${warning}`);
  }
  return config;
}

async function runArrangeOnAfterWriteHook(
  config: CodefastConfig | undefined,
  modifiedFiles: string[],
  logger: CliLogger,
): Promise<void> {
  if (modifiedFiles.length === 0) return;
  const hook = config?.arrange?.onAfterWrite;
  if (!hook) return;
  try {
    await hook({ files: modifiedFiles });
  } catch (error) {
    logger.err(
      `[arrange] onAfterWrite hook failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function runArrangeAction(
  resolvedTarget: string,
  runOpts: ArrangeCliRunOpts,
  fs: CliFs,
  logger: CliLogger,
): Promise<ArrangeRunResult | undefined> {
  try {
    const result = runOnTarget(
      resolvedTarget,
      {
        write: runOpts.write,
        withClassName: !!runOpts.withClassName,
        cnImport: runOpts.cnImport,
      },
      fs,
      logger,
    );
    return result;
  } catch (e) {
    if (!handleArrangeLibError(e, logger)) throw e;
    return undefined;
  }
}

export function registerArrangeCommand(program: Command): void {
  const arrange = program
    .command("arrange")
    .description("Analyze and regroup Tailwind classes in cn() / tv() calls (Tailwind v4)");

  arrange
    .command("analyze")
    .description("Report long strings, nested cn in tv(), and related findings")
    .argument("[target]", "Directory or file (default: packages/ui/src/components)")
    .action((target: string | undefined) => {
      const fs = createNodeCliFs();
      const logger = createNodeCliLogger();
      const resolved = target ? path.resolve(target) : defaultTargetPath();
      if (!checkTargetExists(resolved, fs, logger)) return;
      printAnalyzeReport(resolved, analyzeDirectory(resolved, fs), logger);
    });

  arrange
    .command("preview")
    .description("Dry-run: print suggested replacements without writing files")
    .argument("[target]", "Directory or file (default: packages/ui/src/components)")
    .addOption(createWithClassNameOption())
    .option("--cn-import <spec>", "Override module specifier when adding cn import")
    .action(
      async (target: string | undefined, opts: { withClassName?: boolean; cnImport?: string }) => {
        const fs = createNodeCliFs();
        const logger = createNodeCliLogger();
        const resolved = target ? path.resolve(target) : defaultTargetPath();
        if (!checkTargetExists(resolved, fs, logger)) return;
        await runArrangeAction(
          resolved,
          {
            write: false,
            withClassName: opts.withClassName,
            cnImport: opts.cnImport,
          },
          fs,
          logger,
        );
      },
    );

  arrange
    .command("apply")
    .description("Apply grouping and cn-in-tv unwrap edits to files")
    .argument("[target]", "Directory or file (default: packages/ui/src/components)")
    .addOption(createWithClassNameOption())
    .option("--cn-import <spec>", "Override module specifier when adding cn import")
    .action(
      async (target: string | undefined, opts: { withClassName?: boolean; cnImport?: string }) => {
        const fs = createNodeCliFs();
        const logger = createNodeCliLogger();
        const resolved = target ? path.resolve(target) : defaultTargetPath();
        if (!checkTargetExists(resolved, fs, logger)) return;
        const result = await runArrangeAction(
          resolved,
          {
            write: true,
            withClassName: opts.withClassName,
            cnImport: opts.cnImport,
          },
          fs,
          logger,
        );
        if (!result || result.modifiedFiles.length === 0) return;
        const config = await loadCodefastConfigWithWarnings(fs, logger);
        await runArrangeOnAfterWriteHook(config, result.modifiedFiles, logger);
      },
    );

  arrange
    .command("group")
    .description("Try grouping on a pasted class string (stdout: cn(...) or tv array with --tv)")
    .argument("[tokens...]", "Class tokens (quote a single string if it contains spaces)")
    .option("--tv", "Emit tv()-style array instead of cn() call", false)
    .addOption(createWithClassNameOption())
    .action((tokens: string[], opts: { tv?: boolean; withClassName?: boolean }) => {
      const inlineClasses = tokens.join(" ").trim();
      if (!inlineClasses) {
        process.stderr.write(
          'Pass a class string. Example: codefast arrange group "flex gap-2 text-sm rounded-md"\n',
        );
        process.exitCode = 1;
        return;
      }
      const groups = suggestCnGroups(inlineClasses);
      const result = opts.tv
        ? formatArray(groups)
        : formatCnCall(groups, { trailingClassName: !!opts.withClassName });
      process.stdout.write(`${result}\n`);
      const bucketSummary = summarizeGroupBucketLabels(groups);
      process.stdout.write(`\n// Buckets: ${JSON.stringify(bucketSummary)}\n`);
    });
}
