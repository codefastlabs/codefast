import path from "node:path";
import process from "node:process";
import { Command } from "commander";
import type { CliLogger } from "#lib/infra/fs-contract";
import { loadConfig } from "#lib/config/loader";
import type { CodefastConfig } from "#lib/config/schema";
import { createNodeCliFs, createNodeCliLogger, runTagOnTarget } from "#lib/tag";

const DEFAULT_TAG_TARGET = "src";

async function runTagOnAfterWriteHook(
  config: CodefastConfig | undefined,
  modifiedFiles: string[],
  logger: CliLogger,
): Promise<void> {
  if (modifiedFiles.length === 0) return;
  const hook = config?.tag?.onAfterWrite;
  if (!hook) return;
  try {
    await hook({ files: modifiedFiles });
  } catch (error) {
    logger.err(
      `[tag] onAfterWrite hook failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

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

      const write = !options.dryRun;
      const result = runTagOnTarget(resolvedTarget, { write }, fs);
      const mode = write ? "applied" : "dry-run";
      logger.out(
        `[tag:${mode}] version=${result.version} files=${result.filesChanged}/${result.filesScanned} declarations=${result.taggedDeclarations}`,
      );

      if (!write || result.filesChanged === 0) return;
      const modifiedFiles = result.fileResults
        .filter((entry) => entry.changed)
        .map((entry) => entry.filePath);
      const { config, warnings } = await loadConfig(fs);
      for (const warning of warnings) {
        logger.err(`[config] ${warning}`);
      }
      await runTagOnAfterWriteHook(config, modifiedFiles, logger);
    });
}
