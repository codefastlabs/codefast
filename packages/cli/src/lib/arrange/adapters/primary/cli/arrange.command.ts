import { inject, injectable } from "@codefast/di";
import type { Command } from "commander";
import { Option } from "commander";
import type { PresentAnalyzeReportPresenter } from "#/lib/arrange/contracts/analyze-report-presenter.contract";
import {
  AnalyzeDirectoryUseCaseToken,
  GroupFilePreviewPortToken,
  PrepareArrangeWorkspaceUseCaseToken,
  PresentAnalyzeReportPresenterToken,
  RunArrangeSyncUseCaseToken,
  SuggestCnGroupsUseCaseToken,
} from "#/lib/arrange/contracts/tokens";
import type { PrepareArrangeWorkspaceUseCase } from "#/lib/arrange/application/use-cases/prepare-arrange-workspace.use-case";
import type { AnalyzeDirectoryUseCase } from "#/lib/arrange/application/use-cases/analyze-directory.use-case";
import type { RunArrangeSyncUseCase } from "#/lib/arrange/application/use-cases/run-arrange-sync.use-case";
import type { SuggestCnGroupsUseCase } from "#/lib/arrange/application/use-cases/suggest-cn-groups.use-case";
import type { GroupFilePreviewPort } from "#/lib/arrange/application/ports/group-file-preview.port";
import {
  arrangeAnalyzeDirectoryRequestSchema,
  arrangeSuggestGroupsRequestSchema,
  arrangeSyncRunRequestSchema,
} from "#/lib/arrange/presentation/arrange-cli.schema";
import type { ArrangeSuggestGroupsOutput } from "#/lib/arrange/contracts/models";
import type { AnalyzeReport, ArrangeRunResult } from "#/lib/arrange/domain/types.domain";
import {
  exitCodeForArrangeSyncResult,
  presentArrangeSyncResult,
} from "#/lib/arrange/presentation/arrange-sync.presenter";
import type { CliCommand } from "#/lib/kernel/contracts/cli-command.contract";
import { parseWithCliSchema } from "#/lib/core/presentation/cli-schema.parser";
import { consumeCliAppError } from "#/lib/core/presentation/cli-executor.presenter";
import type { CliLogger } from "#/lib/core/application/ports/cli-io.port";
import type { CliRuntime } from "#/lib/core/application/ports/runtime.port";
import { CliLoggerToken, CliRuntimeToken } from "#/lib/core/contracts/tokens";

@injectable([
  inject(CliLoggerToken),
  inject(CliRuntimeToken),
  inject(PrepareArrangeWorkspaceUseCaseToken),
  inject(AnalyzeDirectoryUseCaseToken),
  inject(RunArrangeSyncUseCaseToken),
  inject(SuggestCnGroupsUseCaseToken),
  inject(PresentAnalyzeReportPresenterToken),
  inject(GroupFilePreviewPortToken),
])
export class ArrangeCommand implements CliCommand {
  readonly name = "arrange";
  readonly description = "Analyze and regroup Tailwind classes in cn() / tv() calls (Tailwind v4)";

  constructor(
    private readonly logger: CliLogger,
    private readonly runtime: CliRuntime,
    private readonly prepareWorkspace: PrepareArrangeWorkspaceUseCase,
    private readonly analyzeDirectory: AnalyzeDirectoryUseCase,
    private readonly runArrangeSync: RunArrangeSyncUseCase,
    private readonly suggestCnGroups: SuggestCnGroupsUseCase,
    private readonly presentAnalyzeReport: PresentAnalyzeReportPresenter,
    private readonly groupFilePreview: GroupFilePreviewPort,
  ) {}

  private withClassNameOption(): Option {
    return new Option(
      "--with-classname, --with-class-name",
      "Append className as final cn() argument",
    ).default(false);
  }

  register(program: Command): void {
    const arrange = program.command(this.name).description(this.description);

    arrange
      .command("analyze")
      .description("Report long strings, nested cn in tv(), and related findings")
      .argument("[target]", "Directory or file (default: nearest package directory from cwd)")
      .option("--json", "Print one JSON object on stdout instead of a human report", false)
      .action((target: string | undefined, options: { json?: boolean }) =>
        this.executeAnalyze(target, options),
      );

    arrange
      .command("preview")
      .description("Dry-run: print suggested replacements without writing files")
      .argument("[target]", "Directory or file (default: nearest package directory from cwd)")
      .addOption(this.withClassNameOption())
      .option("--cn-import <spec>", "Override module specifier when adding cn import")
      .option("--json", "Print one JSON object on stdout (suppresses human progress)", false)
      .action(
        (
          target: string | undefined,
          opts: { withClassName?: boolean; cnImport?: string; json?: boolean },
        ) => this.executePreviewOrApply(false, target, opts),
      );

    arrange
      .command("apply")
      .description("Apply grouping and cn-in-tv unwrap edits to files")
      .argument("[target]", "Directory or file (default: nearest package directory from cwd)")
      .addOption(this.withClassNameOption())
      .option("--cn-import <spec>", "Override module specifier when adding cn import")
      .option("--json", "Print one JSON object on stdout (suppresses human progress)", false)
      .action(
        (
          target: string | undefined,
          opts: { withClassName?: boolean; cnImport?: string; json?: boolean },
        ) => this.executePreviewOrApply(true, target, opts),
      );

    arrange
      .command("group")
      .description("Try grouping on a pasted class string (stdout: cn(...) or tv array with --tv)")
      .argument("[tokens...]", "Class tokens (quote a single string if it contains spaces)")
      .option("--tv", "Emit tv()-style array instead of cn() call", false)
      .addOption(this.withClassNameOption())
      .option("--json", "Print one JSON object on stdout instead of plain lines", false)
      .action((tokens: string[], opts: { tv?: boolean; withClassName?: boolean; json?: boolean }) =>
        this.executeGroup(tokens, opts),
      );
  }

  private async executeAnalyze(
    target: string | undefined,
    options?: { json?: boolean },
  ): Promise<void> {
    const prelude = await this.prepareWorkspace.execute({
      currentWorkingDirectory: this.runtime.cwd(),
      rawTarget: target,
    });
    if (!consumeCliAppError(this.logger, prelude)) {
      return;
    }
    const { resolvedTarget } = prelude.value;
    const parsed = parseWithCliSchema(arrangeAnalyzeDirectoryRequestSchema, {
      analyzeRootPath: resolvedTarget,
    });
    if (!consumeCliAppError(this.logger, parsed)) {
      return;
    }
    const outcome = this.analyzeDirectory.execute(parsed.value);
    if (!consumeCliAppError(this.logger, outcome)) {
      return;
    }
    if (options?.json) {
      this.logger.out(this.formatArrangeAnalyzeJsonOutput(resolvedTarget, outcome.value));
    } else {
      this.presentAnalyzeReport.present(resolvedTarget, outcome.value);
    }
  }

  private async executePreviewOrApply(
    write: boolean,
    target: string | undefined,
    opts: { withClassName?: boolean; cnImport?: string; json?: boolean },
  ): Promise<void> {
    const prelude = await this.prepareWorkspace.execute({
      currentWorkingDirectory: this.runtime.cwd(),
      rawTarget: target,
    });
    if (!consumeCliAppError(this.logger, prelude)) {
      return;
    }
    const { resolvedTarget, rootDir, config } = prelude.value;
    const parsed = parseWithCliSchema(arrangeSyncRunRequestSchema, {
      rootDir,
      targetPath: resolvedTarget,
      write,
      withClassName: opts.withClassName,
      cnImport: opts.cnImport,
      config: config.arrange ?? {},
    });
    if (!consumeCliAppError(this.logger, parsed)) {
      return;
    }
    const outcome = await this.runArrangeSync.execute(parsed.value);
    if (!consumeCliAppError(this.logger, outcome)) {
      return;
    }

    if (!write) {
      for (const plan of outcome.value.previewPlans) {
        this.groupFilePreview.printGroupFilePreviewFromWork(plan);
      }
    }

    if (opts.json) {
      this.logger.out(this.formatArrangeSyncJsonOutput(outcome.value, write));
      this.runtime.setExitCode(exitCodeForArrangeSyncResult(outcome.value));
    } else {
      this.runtime.setExitCode(presentArrangeSyncResult(this.logger, outcome.value, write));
    }
  }

  private async executeGroup(
    tokens: string[],
    opts: { tv?: boolean; withClassName?: boolean; json?: boolean },
  ): Promise<void> {
    const parsed = parseWithCliSchema(arrangeSuggestGroupsRequestSchema, {
      inlineClasses: tokens.join(" ").trim(),
      emitTvStyleArray: !!opts.tv,
      trailingClassName: !!opts.withClassName,
    });
    if (!consumeCliAppError(this.logger, parsed)) {
      return;
    }
    const output = this.suggestCnGroups.execute(parsed.value);
    if (opts.json) {
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
