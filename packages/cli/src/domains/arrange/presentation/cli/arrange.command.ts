import { inject, injectable } from "@codefast/di";
import type { AnalyzeDirectoryPort } from "#/domains/arrange/application/ports/inbound/analyze-directory.port";
import type { PrepareArrangeWorkspacePort } from "#/domains/arrange/application/ports/inbound/prepare-arrange-workspace.port";
import type { RunArrangeSyncPort } from "#/domains/arrange/application/ports/inbound/run-arrange-sync.port";
import type { SuggestCnGroupsPort } from "#/domains/arrange/application/ports/inbound/suggest-cn-groups.port";
import type { PresentGroupFilePreviewPresenter } from "#/domains/arrange/application/ports/presenting/present-group-file-preview.presenter";
import type { PresentArrangeSyncResultPresenter } from "#/domains/arrange/application/ports/presenting/present-arrange-sync-result.presenter";
import type { ArrangeSuggestGroupsOutput } from "#/domains/arrange/contracts/models";
import type { PresentAnalyzeReportPresenter } from "#/domains/arrange/application/ports/presenting/present-analyze-report.presenter";
import {
  AnalyzeDirectoryUseCaseToken,
  PresentGroupFilePreviewPresenterToken,
  PrepareArrangeWorkspaceUseCaseToken,
  PresentAnalyzeReportPresenterToken,
  PresentArrangeSyncResultPresenterToken,
  RunArrangeSyncUseCaseToken,
  SuggestCnGroupsUseCaseToken,
} from "#/domains/arrange/composition/tokens";
import type { AnalyzeReport, ArrangeRunResult } from "#/domains/arrange/domain/types.domain";
import {
  arrangeAnalyzeDirectoryRequestSchema,
  arrangeSuggestGroupsRequestSchema,
  arrangeSyncRunRequestSchema,
} from "#/domains/arrange/presentation/presenters/arrange-cli.schema";
import type { CliExecutor } from "#/shell/application/coordination/cli-executor.coordination";
import type { CliSchemaParsing } from "#/shell/application/coordination/cli-schema-parsing.coordination";
import type { CliLoggerPort } from "#/shell/application/ports/outbound/cli-logger.port";
import type { CliRuntimePort } from "#/shell/application/ports/outbound/cli-runtime.port";
import {
  CliExecutorToken,
  CliLoggerPortToken,
  CliRuntimeToken,
  CliSchemaParsingToken,
} from "#/shell/application/cli-runtime.tokens";
import type {
  CliCommandPort,
  CliCommandTree,
} from "#/shell/application/ports/primary/cli-command.port";
import { CLI_COMMAND_SLOT_NAME } from "#/shell/contracts/cli-command-slots";
import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#/shell/domain/cli-exit-codes.domain";
import { readOptionalPositionalArg } from "#/shell/domain/cli-positional-arg.value-object";

@injectable([
  inject(CliLoggerPortToken),
  inject(CliRuntimeToken),
  inject(PrepareArrangeWorkspaceUseCaseToken),
  inject(AnalyzeDirectoryUseCaseToken),
  inject(RunArrangeSyncUseCaseToken),
  inject(SuggestCnGroupsUseCaseToken),
  inject(PresentAnalyzeReportPresenterToken),
  inject(PresentGroupFilePreviewPresenterToken),
  inject(PresentArrangeSyncResultPresenterToken),
  inject(CliSchemaParsingToken),
  inject(CliExecutorToken),
])
export class ArrangeCommand implements CliCommandPort {
  constructor(
    private readonly logger: CliLoggerPort,
    private readonly runtime: CliRuntimePort,
    private readonly prepareWorkspace: PrepareArrangeWorkspacePort,
    private readonly analyzeDirectory: AnalyzeDirectoryPort,
    private readonly runArrangeSync: RunArrangeSyncPort,
    private readonly suggestCnGroups: SuggestCnGroupsPort,
    private readonly presentAnalyzeReport: PresentAnalyzeReportPresenter,
    private readonly presentGroupFilePreview: PresentGroupFilePreviewPresenter,
    private readonly presentArrangeSyncResult: PresentArrangeSyncResultPresenter,
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
            await this.performAnalyzeSubtree(readOptionalPositionalArg(positionalPieces[0]), {
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
            await this.performApplyOrPreviewSubtree(
              false,
              readOptionalPositionalArg(positionalPieces[0]),
              typedLocalCarrier,
            );
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
            await this.performApplyOrPreviewSubtree(
              true,
              readOptionalPositionalArg(positionalPieces[0]),
              typedLocalCarrier,
            );
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
    targetSlice: string | undefined,
    typedLocalCarrier: Readonly<Record<string, unknown>>,
  ): Promise<void> {
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
        this.presentGroupFilePreview.printGroupFilePreviewFromWork(plan);
      }
    }

    if (typedLocalCarrier.json) {
      this.logger.out(this.formatArrangeSyncJsonOutput(outcome.value, writeCandidate));
      this.runtime.setExitCode(this.exitCodeForArrangeSyncResult(outcome.value));
    } else {
      this.presentArrangeSyncResult.present(outcome.value, writeCandidate);
      this.runtime.setExitCode(this.exitCodeForArrangeSyncResult(outcome.value));
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

  private exitCodeForArrangeSyncResult(result: ArrangeRunResult): number {
    return result.hookError !== null ? CLI_EXIT_GENERAL_ERROR : CLI_EXIT_SUCCESS;
  }
}
