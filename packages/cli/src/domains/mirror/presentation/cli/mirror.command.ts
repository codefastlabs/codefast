import { inject, injectable } from "@codefast/di";
import type {
  CliCommandPort,
  CliCommandTree,
} from "#/shell/application/ports/primary/cli-command.port";
import type { CliExecutor } from "#/shell/application/coordination/cli-executor.coordination";
import type { GlobalCliOptionsParsePort } from "#/shell/application/ports/outbound/global-cli-options-parse.port";
import type { CliSchemaParsing } from "#/shell/application/coordination/cli-schema-parsing.coordination";
import type { CliLoggerPort } from "#/shell/application/ports/outbound/cli-logger.port";
import type { CliRuntimePort } from "#/shell/application/ports/outbound/cli-runtime.port";
import {
  PrepareMirrorSyncUseCaseToken,
  PresentMirrorSyncProgressPresenterToken,
  RunMirrorSyncUseCaseToken,
} from "#/domains/mirror/composition/tokens";
import type { PrepareMirrorSyncPort } from "#/domains/mirror/application/ports/inbound/prepare-mirror-sync.port";
import type { RunMirrorSyncPort } from "#/domains/mirror/application/ports/inbound/run-mirror-sync.port";
import type { MirrorSyncProgressListener } from "#/domains/mirror/application/ports/presenting/present-mirror-sync-progress.presenter";
import {
  exitCodeForMirrorSyncResult,
  formatMirrorSyncJsonOutput,
} from "#/domains/mirror/application/mirror-sync-cli-result";
import { mirrorSyncRunRequestSchema } from "#/domains/mirror/presentation/presenters/mirror-cli.schema";
import { CLI_COMMAND_SLOT_NAME } from "#/shell/contracts/cli-command-slots";
import {
  CliExecutorToken,
  CliLoggerPortToken,
  CliRuntimeToken,
  GlobalCliOptionsParsePortToken,
  CliSchemaParsingToken,
} from "#/shell/application/cli-runtime.tokens";
import { readOptionalPositionalArg } from "#/shell/domain/cli-positional-arg.value-object";

@injectable([
  inject(CliLoggerPortToken),
  inject(CliRuntimeToken),
  inject(PrepareMirrorSyncUseCaseToken),
  inject(RunMirrorSyncUseCaseToken),
  inject(GlobalCliOptionsParsePortToken),
  inject(CliSchemaParsingToken),
  inject(CliExecutorToken),
  inject(PresentMirrorSyncProgressPresenterToken),
])
export class MirrorCommand implements CliCommandPort {
  constructor(
    private readonly logger: CliLoggerPort,
    private readonly runtime: CliRuntimePort,
    private readonly prepareMirrorSync: PrepareMirrorSyncPort,
    private readonly runMirrorSync: RunMirrorSyncPort,
    private readonly globalCliOptions: GlobalCliOptionsParsePort,
    private readonly schemaValidation: CliSchemaParsing,
    private readonly cliExecutor: CliExecutor,
    private readonly mirrorProgressPresenter: MirrorSyncProgressListener,
  ) {}

  get definition(): CliCommandTree {
    return {
      name: CLI_COMMAND_SLOT_NAME.mirror,
      description: "Keep package manifests aligned with what you ship",
      children: [
        {
          name: "sync",
          description: "Write package.json exports from dist/ for workspace packages",
          route: [
            {
              kind: "optionalPositional",
              argumentTemplate: "[package]",
              helpBlurb: "Optional package path relative to repo root (e.g. packages/ui)",
            },
            {
              kind: "booleanFlag",
              flagPhrase: "-v, --verbose",
              helpBlurb: "Print extra diagnostics",
              whenUnsetUses: false,
            },
            {
              kind: "booleanFlag",
              flagPhrase: "--json",
              helpBlurb: "Print one JSON summary on stdout (suppresses human progress)",
              whenUnsetUses: false,
            },
          ],
          action: async (_positionalPieces, typedLocalOptionsCarrier, globalsBridge) => {
            await this.runSynchronizedMirrorLeaf(
              readOptionalPositionalArg(_positionalPieces[0]),
              {
                verbose: typedLocalOptionsCarrier.verbose as boolean | undefined,
                json: typedLocalOptionsCarrier.json as boolean | undefined,
              },
              globalsBridge.readMergedGlobalsOptionRecords(),
            );
          },
        },
      ],
    };
  }

  private async runSynchronizedMirrorLeaf(
    packageRelativePathPiece: string | undefined,
    branchOptionsCarrier: {
      readonly verbose?: boolean | undefined;
      readonly json?: boolean | undefined;
    },
    globalsOptionCarrier: Readonly<Record<string, unknown>>,
  ): Promise<void> {
    const globalOptionsOutcome = this.globalCliOptions.parseGlobalCliOptions(globalsOptionCarrier);
    if (!this.cliExecutor.consumeCliAppError(globalOptionsOutcome)) {
      return;
    }
    const prelude = await this.prepareMirrorSync.execute({
      currentWorkingDirectory: this.runtime.cwd(),
      packageArg: packageRelativePathPiece,
      globals: globalOptionsOutcome.value,
    });
    if (!this.cliExecutor.consumeCliAppError(prelude)) {
      return;
    }
    const { rootDir, config, packageFilter } = prelude.value;
    const parsed = this.schemaValidation.parseWithSchema(mirrorSyncRunRequestSchema, {
      rootDir,
      config: config.mirror ?? {},
      packageFilter,
    });
    if (!this.cliExecutor.consumeCliAppError(parsed)) {
      return;
    }

    const json = !!branchOptionsCarrier.json;
    const noColor = globalOptionsOutcome.value.color === false;
    const verbose = !!branchOptionsCarrier.verbose;

    let listener: MirrorSyncProgressListener | undefined;
    if (!json) {
      this.mirrorProgressPresenter.configure({ noColor, verbose });
      listener = this.mirrorProgressPresenter;
    }

    const startTime = performance.now();
    const outcome = await this.runMirrorSync.execute({ ...parsed.value, listener });
    if (!this.cliExecutor.consumeCliAppError(outcome)) {
      return;
    }
    if (json) {
      this.logger.out(
        formatMirrorSyncJsonOutput(outcome.value, (performance.now() - startTime) / 1000),
      );
    }
    this.runtime.setExitCode(exitCodeForMirrorSyncResult(outcome.value));
  }
}
