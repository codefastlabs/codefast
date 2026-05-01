import { inject, injectable } from "@codefast/di";
import type {
  CliCommandPort,
  CliCommandTree,
} from "#/shell/application/ports/primary/cli-command.port";
import type { CliExecutor } from "#/shell/application/coordination/cli-executor.coordination";
import type { GlobalCliOptionsParsePort } from "#/shell/application/ports/outbound/global-cli-options-parse.port";
import type { CliSchemaParsing } from "#/shell/application/coordination/cli-schema-parsing.coordination";
import type { CliRuntimePort } from "#/shell/application/ports/outbound/cli-runtime.port";
import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#/shell/domain/cli-exit-codes.domain";
import {
  PrepareMirrorSyncUseCaseToken,
  RunMirrorSyncUseCaseToken,
} from "#/domains/mirror/composition/tokens";
import type { PrepareMirrorSyncPort } from "#/domains/mirror/application/ports/inbound/prepare-mirror-sync.port";
import type { RunMirrorSyncPort } from "#/domains/mirror/application/ports/inbound/run-mirror-sync.port";
import { mirrorSyncRunRequestSchema } from "#/domains/mirror/presentation/presenters/mirror-cli.schema";
import { CLI_COMMAND_SLOT_NAME } from "#/shell/contracts/cli-command-slots";
import {
  CliExecutorToken,
  CliRuntimeToken,
  GlobalCliOptionsParsePortToken,
  CliSchemaParsingToken,
} from "#/shell/application/cli-runtime.tokens";

@injectable([
  inject(CliRuntimeToken),
  inject(PrepareMirrorSyncUseCaseToken),
  inject(RunMirrorSyncUseCaseToken),
  inject(GlobalCliOptionsParsePortToken),
  inject(CliSchemaParsingToken),
  inject(CliExecutorToken),
])
export class MirrorCommand implements CliCommandPort {
  constructor(
    private readonly runtime: CliRuntimePort,
    private readonly prepareMirrorSync: PrepareMirrorSyncPort,
    private readonly runMirrorSync: RunMirrorSyncPort,
    private readonly globalCliOptions: GlobalCliOptionsParsePort,
    private readonly schemaValidation: CliSchemaParsing,
    private readonly cliExecutor: CliExecutor,
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
              this.readOptionalPackagePiece(_positionalPieces[0]),
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

  private readOptionalPackagePiece(candidate: unknown): string | undefined {
    if (typeof candidate === "string") {
      return candidate;
    }
    if (candidate === undefined) {
      return undefined;
    }
    if (candidate === null) {
      return "null";
    }
    if (
      typeof candidate === "number" ||
      typeof candidate === "boolean" ||
      typeof candidate === "bigint"
    ) {
      return String(candidate);
    }
    if (typeof candidate === "symbol") {
      return candidate.toString();
    }
    return undefined;
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
    const { rootDir, config, packageFilter, globals } = prelude.value;
    const parsed = this.schemaValidation.parseWithSchema(mirrorSyncRunRequestSchema, {
      rootDir,
      config: config.mirror ?? {},
      verbose: branchOptionsCarrier.verbose,
      json: branchOptionsCarrier.json,
      noColor: globals.color === false,
      packageFilter,
    });
    if (!this.cliExecutor.consumeCliAppError(parsed)) {
      return;
    }
    await this.cliExecutor.runCliResultAsync(this.runMirrorSync.execute(parsed.value), (stats) =>
      stats.packagesErrored > 0 ? CLI_EXIT_GENERAL_ERROR : CLI_EXIT_SUCCESS,
    );
  }
}
