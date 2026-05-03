import { inject, injectable } from "@codefast/di";
import type {
  CliCommandPort,
  CliCommandTree,
} from "#/shell/application/ports/primary/cli-command.port";
import type { CliExecutor } from "#/shell/application/coordination/cli-executor.coordination";
import type { CliSchemaParsing } from "#/shell/application/coordination/cli-schema-parsing.coordination";
import type { CliLoggerPort } from "#/shell/application/ports/outbound/cli-logger.port";
import type { CliRuntimePort } from "#/shell/application/ports/outbound/cli-runtime.port";
import type { PrepareTagSyncPort } from "#/domains/tag/application/ports/inbound/prepare-tag-sync.port";
import type { RunTagSyncPort } from "#/domains/tag/application/ports/inbound/run-tag-sync.port";
import { exitCodeForTagSyncResult } from "#/domains/tag/application/tag-sync-cli-result";
import type { PresentTagSyncResultPresenter } from "#/domains/tag/application/ports/presenting/present-tag-sync-result.presenter";
import type { PresentTagSyncProgressPresenter } from "#/domains/tag/application/ports/presenting/present-tag-sync-progress.presenter";
import {
  PrepareTagSyncUseCaseToken,
  PresentTagSyncProgressPresenterToken,
  PresentTagSyncResultPresenterToken,
  RunTagSyncUseCaseToken,
} from "#/domains/tag/composition/tokens";
import { CLI_COMMAND_SLOT_NAME } from "#/shell/contracts/cli-command-slots";
import type { TagSyncResult } from "#/domains/tag/domain/types.domain";
import { tagSyncRunRequestSchema } from "#/domains/tag/presentation/presenters/tag-cli.schema";
import {
  CliExecutorToken,
  CliLoggerPortToken,
  CliRuntimeToken,
  CliSchemaParsingToken,
} from "#/shell/application/cli-runtime.tokens";
import { readOptionalPositionalArg } from "#/shell/domain/cli-positional-arg.value-object";

@injectable([
  inject(CliLoggerPortToken),
  inject(CliRuntimeToken),
  inject(PrepareTagSyncUseCaseToken),
  inject(RunTagSyncUseCaseToken),
  inject(PresentTagSyncProgressPresenterToken),
  inject(PresentTagSyncResultPresenterToken),
  inject(CliSchemaParsingToken),
  inject(CliExecutorToken),
])
export class TagCommand implements CliCommandPort {
  constructor(
    private readonly logger: CliLoggerPort,
    private readonly runtime: CliRuntimePort,
    private readonly prepareTagSync: PrepareTagSyncPort,
    private readonly runTagSync: RunTagSyncPort,
    private readonly tagProgressPresenter: PresentTagSyncProgressPresenter,
    private readonly presentSyncCliResult: PresentTagSyncResultPresenter,
    private readonly schemaValidation: CliSchemaParsing,
    private readonly cliExecutor: CliExecutor,
  ) {}

  get definition(): CliCommandTree {
    return {
      name: CLI_COMMAND_SLOT_NAME.tag,
      description: "Add @since <version> JSDoc tags to exported declarations",
      aliases: ["annotate"],
      route: [
        {
          kind: "optionalPositional",
          argumentTemplate: "[target]",
          helpBlurb: "Directory or file to annotate (default: auto-discover workspace packages)",
        },
        {
          kind: "booleanFlag",
          flagPhrase: "--dry-run",
          helpBlurb: "Show summary without writing files",
          whenUnsetUses: false,
        },
        {
          kind: "booleanFlag",
          flagPhrase: "--json",
          helpBlurb: "Print one JSON summary on stdout (suppresses human progress)",
          whenUnsetUses: false,
        },
      ],
      action: async (positionalArguments, localOptionRecord) => {
        const typedOptionsCarrier = localOptionRecord as {
          readonly dryRun?: boolean;
          readonly json?: boolean;
        };
        await this.runAnnotatedTagVerb(readOptionalPositionalArg(positionalArguments[0]), {
          dryRun: typedOptionsCarrier.dryRun,
          json: typedOptionsCarrier.json,
        });
      },
    };
  }

  private async runAnnotatedTagVerb(
    rawTargetPiece: string | undefined,
    options: { readonly dryRun?: boolean; readonly json?: boolean },
  ): Promise<void> {
    const prelude = await this.prepareTagSync.execute({
      currentWorkingDirectory: this.runtime.cwd(),
      rawTarget: rawTargetPiece,
    });
    if (!this.cliExecutor.consumeCliAppError(prelude)) {
      return;
    }
    const { rootDir, config, resolvedTargetPath } = prelude.value;
    const tagConfig = config.tag ?? {};
    const parsed = this.schemaValidation.parseWithSchema(tagSyncRunRequestSchema, {
      rootDir,
      write: !options.dryRun,
      json: options.json,
      targetPath: resolvedTargetPath,
      skipPackages: tagConfig.skipPackages,
      config: tagConfig,
    });
    if (!this.cliExecutor.consumeCliAppError(parsed)) {
      return;
    }
    const tagOutcome = await this.runTagSync.execute({
      ...parsed.value,
      listener: parsed.value.json ? undefined : this.tagProgressPresenter,
    });
    if (!this.cliExecutor.consumeCliAppError(tagOutcome)) {
      return;
    }
    if (parsed.value.json) {
      this.logger.out(this.formatTagSyncJsonOutput(tagOutcome.value, rootDir));
      this.runtime.setExitCode(exitCodeForTagSyncResult(tagOutcome.value));
    } else {
      this.runtime.setExitCode(this.presentSyncCliResult.present(tagOutcome.value, rootDir));
    }
  }

  private formatTagSyncJsonOutput(result: TagSyncResult, rootDir: string): string {
    return JSON.stringify({
      schemaVersion: 1 as const,
      ok: result.hookError === null,
      cwd: rootDir,
      result,
    });
  }
}
