import path from "node:path";
import type { CodefastAfterWriteHook, CodefastTagConfig } from "#/config/schema";
import { AppError } from "#/core/errors";
import { messageFrom } from "#/core/errors";
import type { FilesystemPort } from "#/core/filesystem";
import type { Result } from "#/core/result";
import { err, ok } from "#/core/result";
import type {
  TagFileResult,
  TagProgressListener,
  TagResolvedTarget,
  TagSyncResult,
  TagTargetCandidate,
  TagTargetExecutionResult,
} from "#/tag/domain/types.domain";
import { resolveTagTargetCandidates } from "#/tag/target-candidates";
import { runTagOnTarget } from "#/tag/tag-target-runner";

export type TagSyncRunRequest = {
  rootDir: string;
  write: boolean;
  json?: boolean;
  targetPath?: string;
  skipPackages?: string[];
  config?: unknown;
};

export type TagSyncExecutionInput = TagSyncRunRequest & {
  readonly listener?: TagProgressListener | undefined;
};

export async function runTagSync(
  fs: FilesystemPort,
  input: TagSyncExecutionInput,
): Promise<Result<TagSyncResult, AppError>> {
  try {
    const tagConfig = input.config as CodefastTagConfig | undefined;
    const targetCandidates = await resolveTagTargetCandidates(fs, input.rootDir, input.targetPath);
    const { includedCandidates, skippedPackages } = filterSkippedCandidates(
      targetCandidates,
      input.skipPackages,
    );
    const selectedTargets = includedCandidates.map((candidate) =>
      resolveTargetSelection(fs, candidate, input.rootDir),
    );
    const targetExecutionResults = await Promise.all(
      selectedTargets.map((resolvedTarget) =>
        runOnResolvedTarget(fs, resolvedTarget, input.write, input.listener),
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
        ? await runTagOnAfterWriteHook(tagConfig?.onAfterWrite, modifiedFiles)
        : null;
    const versionsSet = extractDistinctVersions(targetExecutionResults);
    const distinctVersions = [...versionsSet].sort((left, right) => left.localeCompare(right));

    return ok({
      mode: input.write ? "applied" : "dry-run",
      selectedTargets,
      skippedPackages,
      targetResults: targetExecutionResults,
      filesScanned,
      filesChanged,
      taggedDeclarations,
      versionSummary: summarizeVersions(versionsSet),
      distinctVersions,
      modifiedFiles,
      hookError,
    });
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }
}

async function runTagOnAfterWriteHook(
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
    return `[tag] onAfterWrite hook failed: ${messageFrom(caughtHookError)}`;
  }
}

function summarizeVersions(distinctVersions: Set<string>): string {
  if (distinctVersions.size === 0) {
    return "none";
  }
  if (distinctVersions.size > 1) {
    return "mixed";
  }
  return distinctVersions.values().next().value ?? "none";
}

function extractDistinctVersions(targetResults: TagTargetExecutionResult[]): Set<string> {
  return new Set(
    targetResults
      .map((targetResult) => targetResult.result?.version)
      .filter((version): version is string => typeof version === "string" && version.length > 0),
  );
}

function chooseWorkspacePackageTargetPath(
  fs: FilesystemPort,
  candidate: TagTargetCandidate,
): {
  targetPath: string;
  source: TagResolvedTarget["source"];
} {
  if (candidate.source !== "workspace-package") {
    return {
      targetPath: candidate.candidatePath,
      source: candidate.source,
    };
  }

  const preferredSourceDir = path.join(candidate.candidatePath, "src");
  try {
    if (fs.statSync(preferredSourceDir).isDirectory()) {
      return { targetPath: preferredSourceDir, source: "workspace-package-selected-src" };
    }
  } catch {
    // preferredSourceDir does not exist; fall through to package root
  }

  return {
    targetPath: candidate.candidatePath,
    source: "workspace-package-selected-root",
  };
}

function resolveTargetSelection(
  fs: FilesystemPort,
  candidate: TagTargetCandidate,
  rootDir: string,
): TagResolvedTarget {
  const selectedTarget = chooseWorkspacePackageTargetPath(fs, candidate);
  const rootRelativeTargetPath = path
    .relative(rootDir, selectedTarget.targetPath)
    .split(path.sep)
    .join("/");
  return {
    targetPath: selectedTarget.targetPath,
    rootRelativeTargetPath: rootRelativeTargetPath || ".",
    source: selectedTarget.source,
    packageDir: candidate.packageDir,
    packageName: candidate.packageName,
  };
}

function filterSkippedCandidates(
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

async function runOnResolvedTarget(
  fs: FilesystemPort,
  resolvedTarget: TagResolvedTarget,
  write: boolean,
  listener: TagProgressListener | undefined,
): Promise<TagTargetExecutionResult> {
  listener?.onTargetStarted(resolvedTarget);
  const absoluteTargetPath = path.resolve(resolvedTarget.targetPath);
  if (!fs.existsSync(absoluteTargetPath)) {
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
    const runResult = runTagOnTarget(fs, absoluteTargetPath, { write });
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
      runError: messageFrom(caughtRunError),
      result: null,
    };
    listener?.onTargetCompleted(resolvedTarget, failedTargetRunResult);
    return failedTargetRunResult;
  }
}
