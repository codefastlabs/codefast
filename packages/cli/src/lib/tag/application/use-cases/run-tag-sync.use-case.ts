import { injectable } from "@codefast/di";
import { appError, type AppError } from "#lib/core/domain/errors.domain";
import { err, ok, type Result } from "#lib/core/domain/result.model";
import type { CodefastAfterWriteHook, CodefastTagConfig } from "#lib/config/domain/schema.domain";
import type { CliFs } from "#lib/core/application/ports/cli-io.port";
import type { CliPath } from "#lib/core/application/ports/path.port";
import { messageFromCaughtUnknown } from "#lib/core/application/utils/caught-unknown-message.util";
import type { TagSinceWriterPort } from "#lib/tag/application/ports/tag-since-writer.port";
import type { TagSyncRunRequest } from "#lib/tag/application/requests/tag-sync.request";
import type { TagVersionResolverPort } from "#lib/tag/application/ports/tag-version-resolver.port";
import type { TagTargetResolverPort } from "#lib/tag/application/ports/target-resolver.port";
import type { TypeScriptTreeWalkPort } from "#lib/tag/application/ports/typescript-tree-walk.port";
import type {
  TagFileResult,
  TagProgressListener,
  TagTargetCandidate,
  TagTargetSource,
  TagResolvedTarget,
  TagRunOptions,
  TagRunResult,
  TagSyncResult,
  TagTargetExecutionResult,
} from "#lib/tag/domain/types.domain";
import {
  CliFsToken,
  CliPathToken,
  TagSinceWriterPortToken,
  TagTargetResolverPortToken,
  TagVersionResolverPortToken,
  TypeScriptTreeWalkPortToken,
  type RunTagSyncUseCase,
} from "#lib/tokens";

export type TagSyncExecutionInput = TagSyncRunRequest & {
  listener?: TagProgressListener;
};

export function resolveNearestPackageVersion(
  targetPath: string,
  fs: CliFs,
  versionResolver: TagVersionResolverPort,
): string {
  return versionResolver.resolveNearestPackageVersion(targetPath, fs);
}

export function runTagOnTarget(
  targetPath: string,
  opts: TagRunOptions,
  fs: CliFs,
  pathService: CliPath,
  versionResolver: TagVersionResolverPort,
  sinceWriter: TagSinceWriterPort,
  typeScriptTreeWalk: TypeScriptTreeWalkPort,
): TagRunResult {
  const resolvedTarget = pathService.resolve(targetPath);
  const version = resolveNearestPackageVersion(resolvedTarget, fs, versionResolver);

  const files = fs.statSync(resolvedTarget).isDirectory()
    ? typeScriptTreeWalk.walkTsxFiles(resolvedTarget, fs)
    : [resolvedTarget];
  const tsFiles = files.filter((filePath) => filePath.endsWith(".ts") || filePath.endsWith(".tsx"));

  const fileResults = tsFiles.map((filePath) =>
    sinceWriter.applySinceTagsToFile(filePath, version, fs, opts.write),
  );
  const filesChanged = fileResults.filter((result) => result.changed).length;
  const taggedDeclarations = fileResults.reduce(
    (sum, result) => sum + result.taggedDeclarations,
    0,
  );

  return {
    version,
    filesScanned: tsFiles.length,
    filesChanged,
    taggedDeclarations,
    fileResults,
  };
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
    return `[tag] onAfterWrite hook failed: ${messageFromCaughtUnknown(caughtHookError)}`;
  }
}

function summarizeVersions(targetResults: TagTargetExecutionResult[]): string {
  const distinctVersions = extractDistinctVersions(targetResults);
  if (distinctVersions.size === 0) {
    return "none";
  }
  if (distinctVersions.size > 1) {
    return "mixed";
  }
  return [...distinctVersions][0]!;
}

function extractDistinctVersions(targetResults: TagTargetExecutionResult[]): Set<string> {
  return new Set(
    targetResults
      .map((targetResult) => targetResult.result?.version)
      .filter((version): version is string => typeof version === "string" && version.length > 0),
  );
}

function chooseWorkspacePackageTargetPath(
  candidate: TagTargetCandidate,
  pathService: CliPath,
  fs: CliFs,
): { targetPath: string; source: TagTargetSource } {
  if (candidate.source !== "workspace-package") {
    return {
      targetPath: candidate.candidatePath,
      source: candidate.source,
    };
  }

  const preferredSourceDir = pathService.join(candidate.candidatePath, "src");
  if (fs.existsSync(preferredSourceDir) && fs.statSync(preferredSourceDir).isDirectory()) {
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

function resolveTargetSelection(
  candidate: TagTargetCandidate,
  rootDir: string,
  pathService: CliPath,
  fs: CliFs,
): TagResolvedTarget {
  const selectedTarget = chooseWorkspacePackageTargetPath(candidate, pathService, fs);
  const rootRelativeTargetPath = pathService
    .relative(rootDir, selectedTarget.targetPath)
    .split(pathService.separator)
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
  resolvedTarget: TagResolvedTarget,
  write: boolean,
  fs: CliFs,
  pathService: CliPath,
  versionResolver: TagVersionResolverPort,
  sinceWriter: TagSinceWriterPort,
  typeScriptTreeWalk: TypeScriptTreeWalkPort,
  listener: TagProgressListener | undefined,
): Promise<TagTargetExecutionResult> {
  listener?.onTargetStarted(resolvedTarget);
  const absoluteTargetPath = pathService.resolve(resolvedTarget.targetPath);
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
    const runResult = runTagOnTarget(
      absoluteTargetPath,
      { write },
      fs,
      pathService,
      versionResolver,
      sinceWriter,
      typeScriptTreeWalk,
    );
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

/**
 * CLI entry: run tagging and optional `onAfterWrite` using config injected by the command layer.
 * Returns structured execution data; presentation/logging belongs to command layer.
 */
@injectable([
  CliFsToken,
  CliPathToken,
  TagTargetResolverPortToken,
  TypeScriptTreeWalkPortToken,
  TagVersionResolverPortToken,
  TagSinceWriterPortToken,
] as const)
export class RunTagSyncUseCaseImpl implements RunTagSyncUseCase {
  constructor(
    private readonly fs: CliFs,
    private readonly path: CliPath,
    private readonly targetResolver: TagTargetResolverPort,
    private readonly typeScriptTreeWalk: TypeScriptTreeWalkPort,
    private readonly versionResolver: TagVersionResolverPort,
    private readonly sinceWriter: TagSinceWriterPort,
  ) {}

  async execute(input: TagSyncExecutionInput): Promise<Result<TagSyncResult, AppError>> {
    try {
      const tagConfig = input.config as CodefastTagConfig | undefined;
      const targetCandidates = await this.targetResolver.resolveTagTargetCandidates(
        input.rootDir,
        input.targetPath,
        this.fs,
      );
      const { includedCandidates, skippedPackages } = filterSkippedCandidates(
        targetCandidates,
        input.skipPackages,
      );
      const selectedTargets = includedCandidates.map((candidate) =>
        resolveTargetSelection(candidate, input.rootDir, this.path, this.fs),
      );
      const targetExecutionResults = await Promise.all(
        selectedTargets.map((resolvedTarget) =>
          runOnResolvedTarget(
            resolvedTarget,
            input.write,
            this.fs,
            this.path,
            this.versionResolver,
            this.sinceWriter,
            this.typeScriptTreeWalk,
            input.listener,
          ),
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
      const distinctVersions = [...extractDistinctVersions(targetExecutionResults)].sort(
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
        versionSummary: summarizeVersions(targetExecutionResults),
        distinctVersions,
        modifiedFiles,
        hookError,
      });
    } catch (caughtError: unknown) {
      return err(appError("INFRA_FAILURE", messageFromCaughtUnknown(caughtError), caughtError));
    }
  }
}
