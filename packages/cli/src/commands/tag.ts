import process from "node:process";
import { Command } from "commander";
import { createCliContainer } from "#lib/core/infra/container.adapter";
import { consumeCliAppError } from "#lib/core/presentation/cli-executor.presenter";
import { parseWithCliSchema } from "#lib/core/presentation/parse-cli-schema.presenter";
import { tagSyncRunRequestSchema } from "#lib/tag/presentation/tag-cli-schema.presenter";

export function registerTagCommand(program: Command): void {
  program
    .command("tag")
    .alias("annotate")
    .description("Add @since <version> JSDoc tags to exported declarations")
    .argument(
      "[target]",
      "Directory or file to annotate (default: auto-discover workspace packages)",
    )
    .option("--dry-run", "Show summary without writing files", false)
    .action(async function (
      this: Command,
      target: string | undefined,
      options: { dryRun?: boolean },
    ) {
      const cli = createCliContainer();
      const prelude = await cli.tag.prepareTagSync({
        currentWorkingDirectory: process.cwd(),
        rawTarget: target,
        globalCliRaw: this.optsWithGlobals(),
      });
      if (!consumeCliAppError(cli.logger, prelude)) {
        return;
      }
      const { rootDir, config, resolvedTargetPath } = prelude.value;
      const tagConfig = config.tag ?? {};
      const parsed = parseWithCliSchema(tagSyncRunRequestSchema, {
        rootDir,
        write: !options.dryRun,
        targetPath: resolvedTargetPath,
        skipPackages: tagConfig.skipPackages,
        config: tagConfig,
      });
      if (!consumeCliAppError(cli.logger, parsed)) {
        return;
      }
      const tagOutcome = await cli.tag.runTagSync({
        ...parsed.value,
        listener: cli.tag.createProgressListener((line) => cli.logger.out(line)),
      });
      if (!consumeCliAppError(cli.logger, tagOutcome)) {
        return;
      }
      process.exitCode = cli.tag.presentSyncCliResult(tagOutcome.value, rootDir);
    });
}
