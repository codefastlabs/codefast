import { inject, injectable } from "@codefast/di";
import type { AnalyzeDirectoryUseCase } from "#/domains/arrange/application/ports/inbound/analyze-directory.port";
import type { PrepareArrangeWorkspaceUseCase } from "#/domains/arrange/application/ports/inbound/prepare-arrange-workspace.port";
import type { RunArrangeSyncUseCase } from "#/domains/arrange/application/ports/inbound/run-arrange-sync.port";
import type { SuggestCnGroupsUseCase } from "#/domains/arrange/application/ports/inbound/suggest-cn-groups.port";
import type { GroupFilePreviewPort } from "#/domains/arrange/application/ports/outbound/group-file-preview.port";
import type { ArrangeSuggestGroupsOutput } from "#/domains/arrange/contracts/models";
import type { PresentAnalyzeReportPresenter } from "#/domains/arrange/application/ports/presenting/present-analyze-report.port";
import {
  AnalyzeDirectoryUseCaseToken,
  GroupFilePreviewPortToken,
  PrepareArrangeWorkspaceUseCaseToken,
  PresentAnalyzeReportPresenterToken,
  RunArrangeSyncUseCaseToken,
  SuggestCnGroupsUseCaseToken,
} from "#/domains/arrange/composition/tokens";
import type { AnalyzeReport, ArrangeRunResult } from "#/domains/arrange/domain/types.domain";
import {
  arrangeAnalyzeDirectoryRequestSchema,
  arrangeSuggestGroupsRequestSchema,
  arrangeSyncRunRequestSchema,
} from "#/domains/arrange/presentation/presenters/arrange-cli.schema";
import {
  exitCodeForArrangeSyncResult,
  presentArrangeSyncResult,
} from "#/domains/arrange/presentation/presenters/arrange-sync.presenter";
import type { CliExecutor } from "#/shell/application/coordination/cli-executor.coordination";
import type { CliSchemaParsing } from "#/shell/application/coordination/cli-schema-parsing.coordination";
import type { CliLogger } from "#/shell/application/ports/outbound/cli-io.port";
import type { CliRuntime } from "#/shell/application/ports/outbound/cli-runtime.port";
import {
  CliExecutorToken,
  CliLoggerToken,
  CliRuntimeToken,
  CliSchemaParsingToken,
} from "#/shell/application/cli-runtime.tokens";
import type {
  CliCommand,
  CliCommandTree,
} from "#/shell/application/ports/primary/cli-command.port";
import { CLI_COMMAND_SLOT_NAME } from "#/shell/contracts/cli-command-slots";

@injectable([
  inject(CliLoggerToken),
  inject(CliRuntimeToken),
  inject(PrepareArrangeWorkspaceUseCaseToken),
  inject(AnalyzeDirectoryUseCaseToken),
  inject(RunArrangeSyncUseCaseToken),
  inject(SuggestCnGroupsUseCaseToken),
  inject(PresentAnalyzeReportPresenterToken),
  inject(GroupFilePreviewPortToken),
  inject(CliSchemaParsingToken),
  inject(CliExecutorToken),
])
export class ArrangeCommand implements CliCommand {
  constructor(
    private readonly logger: CliLogger,
    private readonly runtime: CliRuntime,
    private readonly prepareWorkspace: PrepareArrangeWorkspaceUseCase,
    private readonly analyzeDirectory: AnalyzeDirectoryUseCase,
    private readonly runArrangeSync: RunArrangeSyncUseCase,
    private readonly suggestCnGroups: SuggestCnGroupsUseCase,
    private readonly presentAnalyzeReport: PresentAnalyzeReportPresenter,
    private readonly groupFilePreview: GroupFilePreviewPort,
    private readonly schemaValidation: CliSchemaParsing,
    private readonly cliExecutor: CliExecutor,
  ) {}

  get definition(): CliCommandTree {
    return {
      name: CLI_COMMAND_SLOT_NAME.arrange,
      description: "Analyze and regroup Tailwind classes in cn() / tv() calls (Tailwind v4)",
      children: [
        {
          name: "analyze",
          description: "Report long strings, nested cn in tv(), and related findings",
          route: [
            {
              kind: "optionalPositional",
              argumentTemplate: "[target]",
              helpBlurb: "Directory or file (default: nearest package directory from cwd)",
            },
            {
              kind: "booleanFlag",
              flagPhrase: "--json",
              helpBlurb: "Print one JSON object on stdout instead of a human report",
              whenUnsetUses: false,
            },
          ],
          action: async (positionalPieces, typedLocalCarrier) => {
            await this.performAnalyzeSubtree(this.readOptionalTargetSlice(positionalPieces[0]), {
              jsonCandidate: typedLocalCarrier.json as boolean | undefined,
            });
          },
        },
        {
          name: "preview",
          description: "Dry-run: print suggested replacements without writing files",
          route: [
            {
              kind: "optionalPositional",
              argumentTemplate: "[target]",
              helpBlurb: "Directory or file (default: nearest package directory from cwd)",
            },
            {
              kind: "synonymousBooleanAliases",
              commaJoinedFlags: "--with-classname, --with-class-name",
              helpBlurb: "Append className as final cn() argument",
            },
            {
              kind: "stringPlaceholderFlag",
              flagPhraseWithPlaceholder: "--cn-import <spec>",
              helpBlurb: "Override module specifier when adding cn import",
            },
            {
              kind: "booleanFlag",
              flagPhrase: "--json",
              helpBlurb: "Print one JSON object on stdout (suppresses human progress)",
              whenUnsetUses: false,
            },
          ],
          action: async (positionalPieces, typedLocalCarrier) => {
            await this.performApplyOrPreviewSubtree(false, positionalPieces[0], typedLocalCarrier);
          },
        },
        {
          name: "apply",
          description: "Apply grouping and cn-in-tv unwrap edits to files",
          route: [
            {
              kind: "optionalPositional",
              argumentTemplate: "[target]",
              helpBlurb: "Directory or file (default: nearest package directory from cwd)",
            },
            {
              kind: "synonymousBooleanAliases",
              commaJoinedFlags: "--with-classname, --with-class-name",
              helpBlurb: "Append className as final cn() argument",
            },
            {
              kind: "stringPlaceholderFlag",
              flagPhraseWithPlaceholder: "--cn-import <spec>",
              helpBlurb: "Override module specifier when adding cn import",
            },
            {
              kind: "booleanFlag",
              flagPhrase: "--json",
              helpBlurb: "Print one JSON object on stdout (suppresses human progress)",
              whenUnsetUses: false,
            },
          ],
          action: async (positionalPieces, typedLocalCarrier) => {
            await this.performApplyOrPreviewSubtree(true, positionalPieces[0], typedLocalCarrier);
          },
        },
        {
          name: "group",
          description:
            "Try grouping on a pasted class string (stdout: cn(...) or tv array with --tv)",
          route: [
            {
              kind: "greedyPositional",
              argumentTemplate: "[tokens...]",
              helpBlurb: "Class tokens (quote a single string if it contains spaces)",
            },
            {
              kind: "booleanFlag",
              flagPhrase: "--tv",
              helpBlurb: "Emit tv()-style array instead of cn() call",
              whenUnsetUses: false,
            },
            {
              kind: "synonymousBooleanAliases",
              commaJoinedFlags: "--with-classname, --with-class-name",
              helpBlurb: "Append className as final cn() argument",
            },
            {
              kind: "booleanFlag",
              flagPhrase: "--json",
              helpBlurb: "Print one JSON object on stdout instead of plain lines",
              whenUnsetUses: false,
            },
          ],
          action: async (positionalPieces, typedLocalCarrier) => {
            const rawTokenSeries = positionalPieces[0];
            const classTokenSeries: string[] = Array.isArray(rawTokenSeries)
              ? rawTokenSeries.filter((segment): segment is string => typeof segment === "string")
              : [];
            await this.performGroupSubtree(classTokenSeries, typedLocalCarrier);
          },
        },
      ],
    };
  }

  private readOptionalTargetSlice(candidate: unknown): string | undefined {
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

  private async performAnalyzeSubtree(
    targetSlice: string | undefined,
    optionCarrier: { readonly jsonCandidate: boolean | undefined },
  ): Promise<void> {
    const prelude = await this.prepareWorkspace.execute({
      currentWorkingDirectory: this.runtime.cwd(),
      rawTarget: targetSlice,
    });
    if (!this.cliExecutor.consumeCliAppError(prelude)) {
      return;
    }
    const { resolvedTarget } = prelude.value;
    const parsed = this.schemaValidation.parseWithSchema(arrangeAnalyzeDirectoryRequestSchema, {
      analyzeRootPath: resolvedTarget,
    });
    if (!this.cliExecutor.consumeCliAppError(parsed)) {
      return;
    }
    const outcome = this.analyzeDirectory.execute(parsed.value);
    if (!this.cliExecutor.consumeCliAppError(outcome)) {
      return;
    }
    if (optionCarrier.jsonCandidate) {
      this.logger.out(this.formatArrangeAnalyzeJsonOutput(resolvedTarget, outcome.value));
    } else {
      this.presentAnalyzeReport.present(resolvedTarget, outcome.value);
    }
  }

  private async performApplyOrPreviewSubtree(
    writeCandidate: boolean,
    targetPiece: unknown,
    typedLocalCarrier: Readonly<Record<string, unknown>>,
  ): Promise<void> {
    const targetSlice = this.readOptionalTargetSlice(targetPiece);
    const prelude = await this.prepareWorkspace.execute({
      currentWorkingDirectory: this.runtime.cwd(),
      rawTarget: targetSlice,
    });
    if (!this.cliExecutor.consumeCliAppError(prelude)) {
      return;
    }
    const { resolvedTarget, rootDir, config } = prelude.value;
    const parsed = this.schemaValidation.parseWithSchema(arrangeSyncRunRequestSchema, {
      rootDir,
      targetPath: resolvedTarget,
      write: writeCandidate,
      withClassName: typedLocalCarrier.withClassName as boolean | undefined,
      cnImport: typedLocalCarrier.cnImport as string | undefined,
      config: config.arrange ?? {},
    });
    if (!this.cliExecutor.consumeCliAppError(parsed)) {
      return;
    }
    const outcome = await this.runArrangeSync.execute(parsed.value);
    if (!this.cliExecutor.consumeCliAppError(outcome)) {
      return;
    }

    if (!writeCandidate) {
      for (const plan of outcome.value.previewPlans) {
        this.groupFilePreview.printGroupFilePreviewFromWork(plan);
      }
    }

    if (typedLocalCarrier.json) {
      this.logger.out(this.formatArrangeSyncJsonOutput(outcome.value, writeCandidate));
      this.runtime.setExitCode(exitCodeForArrangeSyncResult(outcome.value));
    } else {
      this.runtime.setExitCode(
        presentArrangeSyncResult(this.logger, outcome.value, writeCandidate),
      );
    }
  }

  private async performGroupSubtree(
    classTokenSeries: string[],
    typedLocalCarrier: Readonly<Record<string, unknown>>,
  ): Promise<void> {
    const parsed = this.schemaValidation.parseWithSchema(arrangeSuggestGroupsRequestSchema, {
      inlineClasses: classTokenSeries.join(" ").trim(),
      emitTvStyleArray: !!typedLocalCarrier.tv,
      trailingClassName: !!typedLocalCarrier.withClassName,
    });
    if (!this.cliExecutor.consumeCliAppError(parsed)) {
      return;
    }
    const output = this.suggestCnGroups.execute(parsed.value);
    if (typedLocalCarrier.json) {
      this.logger.out(this.formatArrangeGroupJsonOutput(output));
    } else {
      this.logger.out(output.primaryLine);
      this.logger.out(output.bucketsCommentLine);
    }
  }

  private formatArrangeAnalyzeJsonOutput(analyzeRootPath: string, report: AnalyzeReport): string {
    return JSON.stringify({ schemaVersion: 1 as const, analyzeRootPath, report });
  }

  private formatArrangeSyncJsonOutput(result: ArrangeRunResult, write: boolean): string {
    const { previewPlans: _plans, ...serializableResult } = result;
    return JSON.stringify({
      schemaVersion: 1 as const,
      ok: result.hookError === null,
      write,
      result: serializableResult,
    });
  }

  private formatArrangeGroupJsonOutput(output: ArrangeSuggestGroupsOutput): string {
    return JSON.stringify({
      schemaVersion: 1 as const,
      primaryLine: output.primaryLine,
      bucketsCommentLine: output.bucketsCommentLine,
    });
  }
}
