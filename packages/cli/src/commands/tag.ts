import path from "node:path";
import process from "node:process";
import { Command } from "commander";
import { consumeCliAppError } from "#lib/core/presentation/cli-executor";
import {
  createCliContext,
  parseWithCliSchema,
  resolveTagWorkspaceRoot,
  tryLoadCodefastConfig,
} from "#lib/core/presentation/create-command-handler";
import { TagSyncRunRequestSchema } from "#lib/tag/application/requests/tag-sync.request";
import {
  createTagProgressListener,
  presentTagSyncCliResult,
} from "#lib/tag/presentation/tag-presenter";

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
    .action(async (target: string | undefined, options: { dryRun?: boolean }) => {
      const cli = createCliContext();
      const rootDir = resolveTagWorkspaceRoot(cli);
      const loadedOutcome = await tryLoadCodefastConfig(cli, rootDir);
      if (!consumeCliAppError(cli.logger, loadedOutcome)) {
        return;
      }
      const tagConfig = loadedOutcome.value.config.tag ?? {};
      const parsed = parseWithCliSchema(TagSyncRunRequestSchema, {
        rootDir,
        write: !options.dryRun,
        targetPath: target ? path.resolve(target) : undefined,
        skipPackages: tagConfig.skipPackages,
        config: tagConfig,
      });
      if (!consumeCliAppError(cli.logger, parsed)) {
        return;
      }
      const tagOutcome = await cli.tag.runTagSync({
        ...parsed.value,
        listener: createTagProgressListener((line) => cli.logger.out(line)),
      });
      if (!consumeCliAppError(cli.logger, tagOutcome)) {
        return;
      }
      process.exitCode = presentTagSyncCliResult(cli.logger, tagOutcome.value, rootDir);
    });
}
