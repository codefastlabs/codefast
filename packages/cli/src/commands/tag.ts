import path from "node:path";
import process from "node:process";
import { Command } from "commander";
import { messageFromCaughtUnknown } from "#lib/infra/caught-unknown-message";
import { loadConfig } from "#lib/config";
import type { CodefastTagConfig } from "#lib/config";
import { printConfigSchemaWarnings } from "#lib/infra/config-reporter";
import { createNodeCliFs, createNodeCliLogger, runTagSync } from "#lib/tag";
import { findRepoRoot } from "#lib/infra/workspace/repo-root";

const DEFAULT_TAG_TARGET = "src";

export function registerTagCommand(program: Command): void {
  program
    .command("tag")
    .alias("annotate")
    .description("Add @since <version> JSDoc tags to exported declarations")
    .argument("[target]", "Directory or file to annotate (default: src)")
    .option("--dry-run", "Show summary without writing files", false)
    .action(async (target: string | undefined, options: { dryRun?: boolean }) => {
      const fs = createNodeCliFs();
      const logger = createNodeCliLogger();
      const resolvedTarget = path.resolve(target ?? DEFAULT_TAG_TARGET);
      if (!fs.existsSync(resolvedTarget)) {
        logger.err(`Not found: ${resolvedTarget}`);
        process.exitCode = 1;
        return;
      }

      const rootDir = findRepoRoot(fs);
      let tagConfig: CodefastTagConfig = {};
      try {
        const { config, warnings } = await loadConfig(fs, rootDir);
        printConfigSchemaWarnings(logger, warnings);
        tagConfig = config.tag ?? {};
      } catch (caughtConfigError: unknown) {
        logger.err(messageFromCaughtUnknown(caughtConfigError));
        process.exitCode = 1;
        return;
      }

      const exitCode = await runTagSync({
        rootDir,
        config: tagConfig,
        targetPath: resolvedTarget,
        write: !options.dryRun,
        fs,
        logger,
      });
      process.exitCode = exitCode;
    });
}
