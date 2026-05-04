import process from "node:process";
import { Command } from "commander";
import { parseWithSchema } from "#/core/schema-parse";
import { consumeCliAppError } from "#/core/cli/result-handle";
import { logger } from "#/core/logger";
import { nodeFilesystem } from "#/core/filesystem/node";
import { readOptionalPositionalArg } from "#/core/cli/positional";
import { prepareTagSync } from "#/tag/prepare";
import { runTagSync } from "#/tag/sync";
import { tagSyncRunRequestSchema } from "#/tag/cli-schema";
import { presentTagSyncResult, TagSyncProgressPresenter } from "#/tag/output";
import type { TagSyncResult } from "#/tag/domain/types";
import { exitCodeForTagSyncResult } from "#/tag/cli-result";

export function createTagCommand(): Command {
  const cmd = new Command("tag")
    .description("Add @since <version> JSDoc tags to exported declarations")
    .alias("annotate")
    .argument(
      "[target]",
      "Directory or file to annotate (default: auto-discover workspace packages)",
    )
    .option("--dry-run", "Show summary without writing files", false)
    .option("--json", "Print one JSON summary on stdout (suppresses human progress)", false)
    .action(async (target: string | undefined, opts: { dryRun?: boolean; json?: boolean }) => {
      const prelude = await prepareTagSync(nodeFilesystem, {
        currentWorkingDirectory: process.cwd(),
        rawTarget: readOptionalPositionalArg(target),
      });
      if (!consumeCliAppError(prelude)) {
        return;
      }
      const { rootDir, config, resolvedTargetPath } = prelude.value;
      const tagConfig = config.tag ?? {};
      const parsed = parseWithSchema(tagSyncRunRequestSchema, {
        rootDir,
        write: !opts.dryRun,
        json: opts.json,
        targetPath: resolvedTargetPath,
        skipPackages: tagConfig.skipPackages,
        config: tagConfig,
      });
      if (!consumeCliAppError(parsed)) {
        return;
      }
      const progressPresenter = new TagSyncProgressPresenter();
      const tagOutcome = await runTagSync(nodeFilesystem, {
        ...parsed.value,
        listener: parsed.value.json ? undefined : progressPresenter,
      });
      if (!consumeCliAppError(tagOutcome)) {
        return;
      }
      if (parsed.value.json) {
        logger.out(formatTagSyncJsonOutput(tagOutcome.value, rootDir));
        process.exitCode = exitCodeForTagSyncResult(tagOutcome.value);
      } else {
        process.exitCode = presentTagSyncResult(tagOutcome.value, rootDir);
      }
    });

  return cmd;
}

function formatTagSyncJsonOutput(result: TagSyncResult, rootDir: string): string {
  return JSON.stringify({
    schemaVersion: 1 as const,
    ok: result.hookError === null,
    cwd: rootDir,
    result,
  });
}
