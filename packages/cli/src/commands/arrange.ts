import path from "node:path";
import process from "node:process";
import type { Command } from "commander";
import { Option } from "commander";
import type { CliFs, CliLogger } from "#lib/infra/fs-contract";
import { messageFromCaughtUnknown } from "#lib/infra/caught-unknown-message";
import { loadConfig } from "#lib/config/loader";
import type { CodefastArrangeConfig } from "#lib/config/schema";
import { printConfigSchemaWarnings } from "#lib/infra/config-reporter";
import {
  analyzeDirectory,
  createNodeCliFs,
  createNodeCliLogger,
  DEFAULT_ARRANGE_TARGET,
  formatArray,
  formatCnCall,
  printAnalyzeReport,
  runArrangeSync,
  suggestCnGroups,
  summarizeGroupBucketLabels,
} from "#lib/arrange";
import { findRepoRoot } from "#lib/repo-root";

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

async function loadArrangeCommandConfig(
  fs: CliFs,
  logger: CliLogger,
  rootDir: string,
): Promise<{ arrangeConfig: CodefastArrangeConfig } | undefined> {
  try {
    const { config, warnings } = await loadConfig(fs, rootDir);
    printConfigSchemaWarnings(logger, warnings);
    return { arrangeConfig: config.arrange ?? {} };
  } catch (caughtConfigError: unknown) {
    logger.err(messageFromCaughtUnknown(caughtConfigError));
    process.exitCode = 1;
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
    .action(async (target: string | undefined) => {
      const fs = createNodeCliFs();
      const logger = createNodeCliLogger();
      const resolved = target ? path.resolve(target) : defaultTargetPath();
      if (!checkTargetExists(resolved, fs, logger)) return;

      const rootDir = findRepoRoot(fs);
      const loaded = await loadArrangeCommandConfig(fs, logger, rootDir);
      if (!loaded) return;

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

        const rootDir = findRepoRoot(fs);
        const loaded = await loadArrangeCommandConfig(fs, logger, rootDir);
        if (!loaded) return;

        const exitCode = await runArrangeSync({
          rootDir,
          config: loaded.arrangeConfig,
          targetPath: resolved,
          write: false,
          withClassName: opts.withClassName,
          cnImport: opts.cnImport,
          fs,
          logger,
        });
        process.exitCode = exitCode;
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

        const rootDir = findRepoRoot(fs);
        const loaded = await loadArrangeCommandConfig(fs, logger, rootDir);
        if (!loaded) return;

        const exitCode = await runArrangeSync({
          rootDir,
          config: loaded.arrangeConfig,
          targetPath: resolved,
          write: true,
          withClassName: opts.withClassName,
          cnImport: opts.cnImport,
          fs,
          logger,
        });
        process.exitCode = exitCode;
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
