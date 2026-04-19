import process from "node:process";
import { inject, injectable } from "@codefast/di";
import type { Command } from "commander";
import { Option } from "commander";
import { formatArrangeAnalyzeJsonOutput } from "#/lib/arrange/application/arrange-analyze-json.format";
import { formatArrangeGroupJsonOutput } from "#/lib/arrange/application/arrange-group-json.format";
import { exitCodeForArrangeSyncResult } from "#/lib/arrange/application/arrange-sync-cli-result";
import { formatArrangeSyncJsonOutput } from "#/lib/arrange/application/arrange-sync-json.format";
import {
  AnalyzeDirectoryUseCaseToken,
  PrepareArrangeOrchestratorToken,
  PresentAnalyzeReportPresenterToken,
  RunArrangeSyncUseCaseToken,
  SuggestCnGroupsUseCaseToken,
} from "#/lib/arrange/contracts/tokens";
import type {
  PrepareArrangeOrchestrator,
  PresentAnalyzeReportPresenter,
} from "#/lib/arrange/contracts/presentation.contract";
import type {
  AnalyzeDirectoryUseCase,
  RunArrangeSyncUseCase,
  SuggestCnGroupsUseCase,
} from "#/lib/arrange/contracts/use-cases.contract";
import {
  arrangeAnalyzeDirectoryRequestSchema,
  arrangeSuggestGroupsRequestSchema,
  arrangeSyncRunRequestSchema,
} from "#/lib/arrange/presentation/arrange-cli-schema.presenter";
import { presentArrangeSyncResult } from "#/lib/arrange/presentation/arrange-sync.presenter";
import { CliLoggerToken } from "#/lib/core/operational/contracts/tokens";
import type { CliCommand } from "#/lib/core/presentation/command.interface";
import { parseWithCliSchema } from "#/lib/core/presentation/parse-cli-schema.presenter";
import { consumeCliAppError } from "#/lib/core/presentation/cli-executor.presenter";
import type { CliLogger } from "#/lib/core/application/ports/cli-io.port";

function withClassNameOption(): Option {
  return new Option(
    "--with-classname, --with-class-name",
    "Append className as final cn() argument",
  ).default(false);
}

@injectable([
  inject(CliLoggerToken),
  inject(PrepareArrangeOrchestratorToken),
  inject(AnalyzeDirectoryUseCaseToken),
  inject(RunArrangeSyncUseCaseToken),
  inject(SuggestCnGroupsUseCaseToken),
  inject(PresentAnalyzeReportPresenterToken),
])
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
      .option("--json", "Print one JSON object on stdout instead of a human report", false)
      .action((target: string | undefined, options: { json?: boolean }) =>
        this.executeAnalyze(target, options),
      );

    arrange
      .command("preview")
      .description("Dry-run: print suggested replacements without writing files")
      .argument("[target]", "Directory or file (default: nearest package directory from cwd)")
      .addOption(withClassNameOption())
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
      .addOption(withClassNameOption())
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
      .addOption(withClassNameOption())
      .option("--json", "Print one JSON object on stdout instead of plain lines", false)
      .action((tokens: string[], opts: { tv?: boolean; withClassName?: boolean; json?: boolean }) =>
        this.executeGroup(tokens, opts),
      );
  }

  private async executeAnalyze(
    target: string | undefined,
    options?: { json?: boolean },
  ): Promise<void> {
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
      json: options?.json,
    });
    if (!consumeCliAppError(this.logger, parsed)) {
      return;
    }
    const outcome = this.analyzeDirectory.execute(parsed.value);
    if (!consumeCliAppError(this.logger, outcome)) {
      return;
    }
    if (parsed.value.json) {
      this.logger.out(formatArrangeAnalyzeJsonOutput(resolvedTarget, outcome.value));
    } else {
      this.presentAnalyzeReport.present(resolvedTarget, outcome.value);
    }
  }

  private async executePreviewOrApply(
    write: boolean,
    target: string | undefined,
    opts: { withClassName?: boolean; cnImport?: string; json?: boolean },
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
      json: opts.json,
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
    if (parsed.value.json) {
      this.logger.out(formatArrangeSyncJsonOutput(outcome.value, write));
      process.exitCode = exitCodeForArrangeSyncResult(outcome.value);
    } else {
      process.exitCode = presentArrangeSyncResult(this.logger, outcome.value, write);
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
      json: opts.json,
    });
    if (!consumeCliAppError(this.logger, parsed)) {
      return;
    }
    const output = this.suggestCnGroups.execute(parsed.value);
    if (parsed.value.json) {
      this.logger.out(formatArrangeGroupJsonOutput(output));
    } else {
      this.logger.out(output.primaryLine);
      this.logger.out(output.bucketsCommentLine);
    }
  }
}
