import process from "node:process";
import { injectable } from "@codefast/di";
import type { Command } from "commander";
import { Option } from "commander";
import {
  arrangeAnalyzeDirectoryRequestSchema,
  arrangeSuggestGroupsRequestSchema,
  arrangeSyncRunRequestSchema,
} from "#/lib/arrange/presentation/arrange-cli-schema.presenter";
import type { CliCommand } from "#/lib/core/presentation/command.interface";
import { parseWithCliSchema } from "#/lib/core/presentation/parse-cli-schema.presenter";
import {
  consumeCliAppError,
  runCliResultAsync,
} from "#/lib/core/presentation/cli-executor.presenter";
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

type ArrangeAction = "analyze" | "preview" | "apply" | "group";

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
      .action(this.execute.bind(this, "analyze"));

    arrange
      .command("preview")
      .description("Dry-run: print suggested replacements without writing files")
      .argument("[target]", "Directory or file (default: nearest package directory from cwd)")
      .addOption(withClassNameOption())
      .option("--cn-import <spec>", "Override module specifier when adding cn import")
      .action(this.execute.bind(this, "preview"));

    arrange
      .command("apply")
      .description("Apply grouping and cn-in-tv unwrap edits to files")
      .argument("[target]", "Directory or file (default: nearest package directory from cwd)")
      .addOption(withClassNameOption())
      .option("--cn-import <spec>", "Override module specifier when adding cn import")
      .action(this.execute.bind(this, "apply"));

    arrange
      .command("group")
      .description("Try grouping on a pasted class string (stdout: cn(...) or tv array with --tv)")
      .argument("[tokens...]", "Class tokens (quote a single string if it contains spaces)")
      .option("--tv", "Emit tv()-style array instead of cn() call", false)
      .addOption(withClassNameOption())
      .action(this.execute.bind(this, "group"));
  }

  async execute(...args: unknown[]): Promise<void> {
    const [action, ...rest] = args as [ArrangeAction, ...unknown[]];
    switch (action) {
      case "analyze":
        await this.executeAnalyze(rest[0] as string | undefined);
        return;
      case "preview":
        await this.executePreviewOrApply(
          false,
          rest[0] as string | undefined,
          rest[1] as { withClassName?: boolean; cnImport?: string },
        );
        return;
      case "apply":
        await this.executePreviewOrApply(
          true,
          rest[0] as string | undefined,
          rest[1] as { withClassName?: boolean; cnImport?: string },
        );
        return;
      case "group":
        await this.executeGroup(
          rest[0] as string[],
          rest[1] as { tv?: boolean; withClassName?: boolean },
        );
        return;
      default:
        return;
    }
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
    await runCliResultAsync(this.logger, this.runArrangeSync.execute(parsed.value), (code) => code);
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
