import { inject, injectable } from "@codefast/di";
import {
  TagEligibleWorkspacePathsPortToken,
  TagTargetRunnerPortToken,
} from "#/domains/tag/composition/tokens";
import type { TagSyncExecutionInput } from "#/domains/tag/application/requests/tag-sync-execution-input";
import type { TagTargetRunnerPort } from "#/domains/tag/application/ports/outbound/tag-target-runner.port";
import { AppError } from "#/shell/domain/errors.domain";
import type { Result } from "#/shell/domain/result.model";
import { err, ok } from "#/shell/domain/result.model";
import type {
  CodefastAfterWriteHook,
  CodefastTagConfig,
} from "#/domains/config/domain/schema.domain";
import type { CliFilesystemPort } from "#/shell/application/ports/outbound/cli-fs.port";
import type { CliPathPort } from "#/shell/application/ports/outbound/cli-path.port";
import { CliFilesystemPortToken, CliPathPortToken } from "#/shell/application/cli-runtime.tokens";
import { messageFromCaughtUnknown } from "#/shell/domain/caught-unknown-message.value-object";
import type { TagEligibleWorkspacePathsPort } from "#/domains/tag/application/ports/outbound/tag-eligible-workspace-paths.port";
import type { PresentTagSyncProgressPresenter } from "#/domains/tag/application/ports/presenting/present-tag-sync-progress.presenter";
import type {
  TagFileResult,
  TagTargetCandidate,
  TagTargetSource,
  TagResolvedTarget,
  TagSyncResult,
  TagTargetExecutionResult,
} from "#/domains/tag/domain/types.domain";
import type { RunTagSyncUseCase } from "#/domains/tag/application/ports/inbound/run-tag-sync.use-case";

/**
 * CLI entry: run tagging and optional `onAfterWrite` using config injected by the command layer.
 * Returns structured execution data; presentation/logging belongs to command layer.
 */
@injectable([
  inject(CliFilesystemPortToken),
  inject(CliPathPortToken),
  inject(TagEligibleWorkspacePathsPortToken),
  inject(TagTargetRunnerPortToken),
])
export class RunTagSyncUseCaseImpl implements RunTagSyncUseCase {
  constructor(
    private readonly fs: CliFilesystemPort,
    private readonly path: CliPathPort,
    private readonly targetResolver: TagEligibleWorkspacePathsPort,
    private readonly tagTargetRunner: TagTargetRunnerPort,
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
    listener: PresentTagSyncProgressPresenter | undefined,
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
