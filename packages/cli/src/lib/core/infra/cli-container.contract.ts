import type { ArrangeAnalyzeDirectoryRequest } from "#lib/arrange/application/requests/analyze-directory.request";
import type { ArrangeSyncRunRequest } from "#lib/arrange/application/requests/arrange-sync.request";
import type { ArrangeSuggestGroupsRequest } from "#lib/arrange/application/requests/suggest-groups.request";
import type { ArrangeSuggestGroupsOutput } from "#lib/arrange/application/use-cases/suggest-cn-groups.use-case";
import type { AnalyzeReport } from "#lib/arrange/domain/types.domain";
import type { ArrangeTargetWorkspaceAndConfig } from "#lib/arrange/presentation/arrange-prelude.types";
import type { CliFs, CliLogger } from "#lib/core/application/ports/cli-io.port";
import type { CliPath } from "#lib/core/application/ports/path.port";
import type { AppError } from "#lib/core/domain/errors.domain";
import type { Result } from "#lib/core/domain/result.model";
import type { MirrorSyncRunRequest } from "#lib/mirror/application/requests/mirror-sync.request";
import type { MirrorSyncCommandPrelude } from "#lib/mirror/presentation/mirror-prelude.types";
import type { TagSyncExecutionInput } from "#lib/tag/application/use-cases/run-tag-sync.use-case";
import type { TagProgressListener, TagSyncResult } from "#lib/tag/domain/types.domain";
import type { TagCommandPrelude } from "#lib/tag/presentation/tag-prelude.types";
import type { AppOrchestrator } from "#lib/tokens";

/** Composition-root facade: CLI command handlers depend on this shape only (not on the DI container type). */
export type CliContainer = {
  readonly fs: CliFs;
  readonly logger: CliLogger;
  readonly path: CliPath;
  readonly appOrchestrator: AppOrchestrator;
  readonly arrange: {
    prepareTargetWorkspaceAndConfig(args: {
      readonly currentWorkingDirectory: string;
      readonly rawTarget: string | undefined;
    }): Promise<Result<ArrangeTargetWorkspaceAndConfig, AppError>>;
    analyzeDirectory(request: ArrangeAnalyzeDirectoryRequest): Result<AnalyzeReport, AppError>;
    runArrangeSync(request: ArrangeSyncRunRequest): Promise<Result<number, AppError>>;
    suggestCnGroups(request: ArrangeSuggestGroupsRequest): ArrangeSuggestGroupsOutput;
    presentAnalyzeReport(resolvedTargetPath: string, report: AnalyzeReport): void;
  };
  readonly mirror: {
    prepareMirrorSync(args: {
      readonly currentWorkingDirectory: string;
      readonly packageArg: string | undefined;
      readonly globalCliRaw: unknown;
    }): Promise<Result<MirrorSyncCommandPrelude, AppError>>;
    runMirrorSync(request: MirrorSyncRunRequest): Promise<Result<number, AppError>>;
  };
  readonly tag: {
    prepareTagSync(args: {
      readonly currentWorkingDirectory: string;
      readonly rawTarget: string | undefined;
      readonly globalCliRaw: unknown;
    }): Promise<Result<TagCommandPrelude, AppError>>;
    runTagSync(input: TagSyncExecutionInput): Promise<Result<TagSyncResult, AppError>>;
    createProgressListener(emitLine: (line: string) => void): TagProgressListener;
    presentSyncCliResult(result: TagSyncResult, rootDir: string): number;
  };
};
