import { inject, injectable } from "@codefast/di";
import {
  TagTargetResolverPortToken,
  TagTargetRunnerServiceToken,
} from "#/lib/tag/contracts/tokens";
import type { TagSyncExecutionInput } from "#/lib/tag/contracts/models";
import type { TagTargetRunnerService } from "#/lib/tag/contracts/services.contract";
import { AppError } from "#/lib/core/domain/errors.domain";
import type { Result } from "#/lib/core/domain/result.model";
import { err, ok } from "#/lib/core/domain/result.model";
import type { CodefastAfterWriteHook, CodefastTagConfig } from "#/lib/config/domain/schema.domain";
import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import type { CliPath } from "#/lib/core/application/ports/path.port";
import { CliFsToken, CliPathToken } from "#/lib/core/contracts/tokens";
import { messageFromCaughtUnknown } from "#/lib/core/domain/caught-unknown-message.value-object";
import type { TagTargetResolverPort } from "#/lib/tag/application/ports/target-resolver.port";
import type {
  TagFileResult,
  TagProgressListener,
  TagTargetCandidate,
  TagTargetSource,
  TagResolvedTarget,
  TagSyncResult,
  TagTargetExecutionResult,
} from "#/lib/tag/domain/types.domain";

export interface RunTagSyncUseCase {
  execute(input: TagSyncExecutionInput): Promise<Result<TagSyncResult, AppError>>;
}

/**
 * CLI entry: run tagging and optional `onAfterWrite` using config injected by the command layer.
 * Returns structured execution data; presentation/logging belongs to command layer.
 */
@injectable([
  inject(CliFsToken),
  inject(CliPathToken),
  inject(TagTargetResolverPortToken),
  inject(TagTargetRunnerServiceToken),
])
export class RunTagSyncUseCaseImpl implements RunTagSyncUseCase {
  constructor(
    private readonly fs: CliFs,
    private readonly path: CliPath,
    private readonly targetResolver: TagTargetResolverPort,
    private readonly tagTargetRunner: TagTargetRunnerService,
  ) {}

  async execute(input: TagSyncExecutionInput): Promise<Result<TagSyncResult, AppError>> {
    try {
      const tagConfig = input.config as CodefastTagConfig | undefined;
      const targetCandidates = await this.targetResolver.resolveTagTargetCandidates(
        input.rootDir,
        input.targetPath,
      );
      const { includedCandidates, skippedPackages } = this.filterSkippedCandidates(
        targetCandidates,
        input.skipPackages,
      );
      const selectedTargets = includedCandidates.map((candidate) =>
        this.resolveTargetSelection(candidate, input.rootDir),
      );
      const targetExecutionResults = await Promise.all(
        selectedTargets.map((resolvedTarget) =>
          this.runOnResolvedTarget(resolvedTarget, input.write, input.listener),
        ),
      );
      const allFileResults: TagFileResult[] = targetExecutionResults.flatMap(
        (targetResult) => targetResult.result?.fileResults ?? [],
      );
      const filesScanned = targetExecutionResults.reduce(
        (sum, targetResult) => sum + (targetResult.result?.filesScanned ?? 0),
        0,
      );
      const filesChanged = targetExecutionResults.reduce(
        (sum, targetResult) => sum + (targetResult.result?.filesChanged ?? 0),
        0,
      );
      const taggedDeclarations = targetExecutionResults.reduce(
        (sum, targetResult) => sum + (targetResult.result?.taggedDeclarations ?? 0),
        0,
      );
      const modifiedFiles = allFileResults
        .filter((entry) => entry.changed)
        .map((entry) => entry.filePath);
      const hookError =
        input.write && modifiedFiles.length > 0
          ? await this.runTagOnAfterWriteHook(tagConfig?.onAfterWrite, modifiedFiles)
          : null;
      const distinctVersions = [...this.extractDistinctVersions(targetExecutionResults)].sort(
        (left, right) => left.localeCompare(right),
      );

      return ok({
        mode: input.write ? "applied" : "dry-run",
        selectedTargets,
        resolvedTargets: selectedTargets,
        skippedPackages,
        targetResults: targetExecutionResults,
        filesScanned,
        filesChanged,
        taggedDeclarations,
        versionSummary: this.summarizeVersions(targetExecutionResults),
        distinctVersions,
        modifiedFiles,
        hookError,
      });
    } catch (caughtError: unknown) {
      return err(new AppError("INFRA_FAILURE", messageFromCaughtUnknown(caughtError), caughtError));
    }
  }

  private async runTagOnAfterWriteHook(
    hook: CodefastAfterWriteHook | undefined,
    modifiedFiles: string[],
  ): Promise<string | null> {
    if (!hook || modifiedFiles.length === 0) {
      return null;
    }
    try {
      await hook({ files: modifiedFiles });
      return null;
    } catch (caughtHookError: unknown) {
      return `[tag] onAfterWrite hook failed: ${messageFromCaughtUnknown(caughtHookError)}`;
    }
  }

  private summarizeVersions(targetResults: TagTargetExecutionResult[]): string {
    const distinctVersions = this.extractDistinctVersions(targetResults);
    if (distinctVersions.size === 0) {
      return "none";
    }
    if (distinctVersions.size > 1) {
      return "mixed";
    }
    for (const version of distinctVersions) {
      return version;
    }
    return "none";
  }

  private extractDistinctVersions(targetResults: TagTargetExecutionResult[]): Set<string> {
    return new Set(
      targetResults
        .map((targetResult) => targetResult.result?.version)
        .filter((version): version is string => typeof version === "string" && version.length > 0),
    );
  }

  private chooseWorkspacePackageTargetPath(candidate: TagTargetCandidate): {
    targetPath: string;
    source: TagTargetSource;
  } {
    if (candidate.source !== "workspace-package") {
      return {
        targetPath: candidate.candidatePath,
        source: candidate.source,
      };
    }

    const preferredSourceDir = this.path.join(candidate.candidatePath, "src");
    if (
      this.fs.existsSync(preferredSourceDir) &&
      this.fs.statSync(preferredSourceDir).isDirectory()
    ) {
      return {
        targetPath: preferredSourceDir,
        source: "workspace-package-selected-src",
      };
    }

    return {
      targetPath: candidate.candidatePath,
      source: "workspace-package-selected-root",
    };
  }

  private resolveTargetSelection(
    candidate: TagTargetCandidate,
    rootDir: string,
  ): TagResolvedTarget {
    const selectedTarget = this.chooseWorkspacePackageTargetPath(candidate);
    const rootRelativeTargetPath = this.path
      .relative(rootDir, selectedTarget.targetPath)
      .split(this.path.separator)
      .join("/");
    return {
      targetPath: selectedTarget.targetPath,
      rootRelativeTargetPath: rootRelativeTargetPath || ".",
      source: selectedTarget.source,
      packageDir: candidate.packageDir,
      packageName: candidate.packageName,
    };
  }

  private filterSkippedCandidates(
    targetCandidates: TagTargetCandidate[],
    skipPackages: readonly string[] | undefined,
  ): { includedCandidates: TagTargetCandidate[]; skippedPackages: string[] } {
    if (!skipPackages || skipPackages.length === 0) {
      return {
        includedCandidates: targetCandidates,
        skippedPackages: [],
      };
    }

    const skipPackageSet = new Set(skipPackages);
    const includedCandidates: TagTargetCandidate[] = [];
    const skippedPackages: string[] = [];
    for (const candidate of targetCandidates) {
      const packageName = candidate.packageName;
      if (packageName && skipPackageSet.has(packageName)) {
        skippedPackages.push(packageName);
        continue;
      }
      includedCandidates.push(candidate);
    }

    return { includedCandidates, skippedPackages };
  }

  private async runOnResolvedTarget(
    resolvedTarget: TagResolvedTarget,
    write: boolean,
    listener: TagProgressListener | undefined,
  ): Promise<TagTargetExecutionResult> {
    listener?.onTargetStarted(resolvedTarget);
    const absoluteTargetPath = this.path.resolve(resolvedTarget.targetPath);
    if (!this.fs.existsSync(absoluteTargetPath)) {
      const missingTargetResult: TagTargetExecutionResult = {
        target: resolvedTarget,
        targetExists: false,
        runError: `Not found: ${absoluteTargetPath}`,
        result: null,
      };
      listener?.onTargetCompleted(resolvedTarget, missingTargetResult);
      return missingTargetResult;
    }

    try {
      const runResult = this.tagTargetRunner.runOnTarget(absoluteTargetPath, { write });
      const targetRunResult: TagTargetExecutionResult = {
        target: resolvedTarget,
        targetExists: true,
        runError: null,
        result: runResult,
      };
      listener?.onTargetCompleted(resolvedTarget, targetRunResult);
      return targetRunResult;
    } catch (caughtRunError: unknown) {
      const failedTargetRunResult: TagTargetExecutionResult = {
        target: resolvedTarget,
        targetExists: true,
        runError: messageFromCaughtUnknown(caughtRunError),
        result: null,
      };
      listener?.onTargetCompleted(resolvedTarget, failedTargetRunResult);
      return failedTargetRunResult;
    }
  }
}
