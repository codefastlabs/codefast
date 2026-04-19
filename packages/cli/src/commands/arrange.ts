import process from "node:process";
import { injectable } from "@codefast/di";
import type { Command } from "commander";
import { Option } from "commander";
import {
  arrangeAnalyzeDirectoryRequestSchema,
  arrangeSuggestGroupsRequestSchema,
  arrangeSyncRunRequestSchema,
} from "#/lib/arrange/presentation/arrange-cli-schema.presenter";
import { presentArrangeSyncResult } from "#/lib/arrange/presentation/arrange-sync.presenter";
import type { CliCommand } from "#/lib/core/presentation/command.interface";
import { parseWithCliSchema } from "#/lib/core/presentation/parse-cli-schema.presenter";
import { consumeCliAppError } from "#/lib/core/presentation/cli-executor.presenter";
import type { CliLogger } from "#/lib/core/application/ports/cli-io.port";
import {
  AnalyzeDirectoryUseCaseToken,
  CliLoggerToken,
  type AnalyzeDirectoryUseCase,
  type PrepareArrangeOrchestrator,
  PrepareArrangeOrchestratorToken,
  type PresentAnalyzeReportPresenter,
  PresentAnalyzeReportPresenterToken,
  type RunArrangeSyncUseCase,
  RunArrangeSyncUseCaseToken,
  type SuggestCnGroupsUseCase,
  SuggestCnGroupsUseCaseToken,
} from "#/lib/tokens";

function withClassNameOption(): Option {
  return new Option(
    "--with-classname, --with-class-name",
    "Append className as final cn() argument",
  ).default(false);
}

@injectable([
  CliLoggerToken,
  PrepareArrangeOrchestratorToken,
  AnalyzeDirectoryUseCaseToken,
  RunArrangeSyncUseCaseToken,
  SuggestCnGroupsUseCaseToken,
  PresentAnalyzeReportPresenterToken,
] as const)
export class ArrangeCommand implements CliCommand {
  readonly name = "arrange";
  readonly description = "Analyze and regroup Tailwind classes in cn() / tv() calls (Tailwind v4)";

  constructor(
    private readonly logger: CliLogger,
    private readonly prepareTargetWorkspaceAndConfig: PrepareArrangeOrchestrator,
    private readonly analyzeDirectory: AnalyzeDirectoryUseCase,
    private readonly runArrangeSync: RunArrangeSyncUseCase,
    private readonly suggestCnGroups: SuggestCnGroupsUseCase,
    private readonly presentAnalyzeReport: PresentAnalyzeReportPresenter,
  ) {}

  register(program: Command): void {
    const arrange = program.command(this.name).description(this.description);

    arrange
      .command("analyze")
      .description("Report long strings, nested cn in tv(), and related findings")
      .argument("[target]", "Directory or file (default: nearest package directory from cwd)")
      .action((target: string | undefined) => this.executeAnalyze(target));

    arrange
      .command("preview")
      .description("Dry-run: print suggested replacements without writing files")
      .argument("[target]", "Directory or file (default: nearest package directory from cwd)")
      .addOption(withClassNameOption())
      .option("--cn-import <spec>", "Override module specifier when adding cn import")
      .action((target: string | undefined, opts: { withClassName?: boolean; cnImport?: string }) =>
        this.executePreviewOrApply(false, target, opts),
      );

    arrange
      .command("apply")
      .description("Apply grouping and cn-in-tv unwrap edits to files")
      .argument("[target]", "Directory or file (default: nearest package directory from cwd)")
      .addOption(withClassNameOption())
      .option("--cn-import <spec>", "Override module specifier when adding cn import")
      .action((target: string | undefined, opts: { withClassName?: boolean; cnImport?: string }) =>
        this.executePreviewOrApply(true, target, opts),
      );

    arrange
      .command("group")
      .description("Try grouping on a pasted class string (stdout: cn(...) or tv array with --tv)")
      .argument("[tokens...]", "Class tokens (quote a single string if it contains spaces)")
      .option("--tv", "Emit tv()-style array instead of cn() call", false)
      .addOption(withClassNameOption())
      .action((tokens: string[], opts: { tv?: boolean; withClassName?: boolean }) =>
        this.executeGroup(tokens, opts),
      );
  }

  private async executeAnalyze(target: string | undefined): Promise<void> {
    const prelude = await this.prepareTargetWorkspaceAndConfig.execute({
      currentWorkingDirectory: process.cwd(),
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
    this.presentAnalyzeReport(resolvedTarget, outcome.value);
  }

  private async executePreviewOrApply(
    write: boolean,
    target: string | undefined,
    opts: { withClassName?: boolean; cnImport?: string },
  ): Promise<void> {
    const prelude = await this.prepareTargetWorkspaceAndConfig.execute({
      currentWorkingDirectory: process.cwd(),
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
    process.exitCode = presentArrangeSyncResult(this.logger, outcome.value, write);
  }

  private async executeGroup(
    tokens: string[],
    opts: { tv?: boolean; withClassName?: boolean },
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
    this.logger.out(output.primaryLine);
    this.logger.out(output.bucketsCommentLine);
  }
}
