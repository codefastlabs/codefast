import path from "node:path";
import { inject, injectable } from "@codefast/di";
import { appError } from "#/lib/core/domain/errors.domain";
import { err, ok } from "#/lib/core/domain/result.model";
import { messageFromCaughtUnknown } from "#/lib/core/application/utils/caught-unknown-message.util";
import type { WorkspaceResolverPort } from "#/lib/arrange/application/ports/workspace-resolver.port";
import { WorkspaceResolverPortToken } from "#/lib/arrange/contracts/tokens";
import type { ArrangeTargetWorkspaceAndConfig } from "#/lib/arrange/contracts/models";
import type { AppError } from "#/lib/core/domain/errors.domain";
import type { Result } from "#/lib/core/domain/result.model";
import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import type { LoadCodefastConfigUseCase } from "#/lib/core/application/load-codefast-config.use-case";
import { CliFsToken, LoadCodefastConfigUseCaseToken } from "#/lib/core/contracts/tokens";
import type { PrepareArrangeWorkspaceUseCase } from "#/lib/arrange/contracts/use-cases.contract";

// ─── Target path resolution ───────────────────────────────────────────────────

const PACKAGE_JSON_FILE = "package.json";

function findNearestPackageDirectory(
  currentWorkingDirectory: string,
  fs: CliFs,
): string | undefined {
  let currentDir = path.resolve(currentWorkingDirectory);
  while (true) {
    const packageJsonPath = path.join(currentDir, PACKAGE_JSON_FILE);
    if (fs.existsSync(packageJsonPath)) {
      return currentDir;
    }
    const parentDirectory = path.dirname(currentDir);
    if (parentDirectory === currentDir) {
      return undefined;
    }
    currentDir = parentDirectory;
  }
}

export function resolveArrangeTargetPath(args: {
  readonly fs: CliFs;
  readonly currentWorkingDirectory: string;
  readonly rawTarget: string | undefined;
}): string {
  const explicitTargetPath = args.rawTarget
    ? path.isAbsolute(args.rawTarget)
      ? path.resolve(args.rawTarget)
      : path.resolve(args.currentWorkingDirectory, args.rawTarget)
    : undefined;
  if (explicitTargetPath) {
    return args.fs.canonicalPathSync(explicitTargetPath);
  }
  const nearestPackageDirectory = findNearestPackageDirectory(
    args.currentWorkingDirectory,
    args.fs,
  );
  const resolvedDefaultTarget = nearestPackageDirectory ?? args.currentWorkingDirectory;
  return args.fs.canonicalPathSync(resolvedDefaultTarget);
}

// ─── Implementation ──────────────────────────────────────────────────────────

@injectable([
  inject(CliFsToken),
  inject(LoadCodefastConfigUseCaseToken),
  inject(WorkspaceResolverPortToken),
])
export class PrepareArrangeWorkspaceUseCaseImpl implements PrepareArrangeWorkspaceUseCase {
  constructor(
    private readonly fs: CliFs,
    private readonly loadCodefastConfig: LoadCodefastConfigUseCase,
    private readonly workspaceResolver: WorkspaceResolverPort,
  ) {}

  async execute(args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  }): Promise<Result<ArrangeTargetWorkspaceAndConfig, AppError>> {
    const resolvedTarget = resolveArrangeTargetPath({
      fs: this.fs,
      currentWorkingDirectory: args.currentWorkingDirectory,
      rawTarget: args.rawTarget,
    });
    if (!this.fs.existsSync(resolvedTarget)) {
      return err(appError("NOT_FOUND", `Not found: ${resolvedTarget}`));
    }
    let rootDir: string;
    try {
      rootDir = this.workspaceResolver.findRepoRoot(args.currentWorkingDirectory);
    } catch (caughtError: unknown) {
      return err(appError("INFRA_FAILURE", messageFromCaughtUnknown(caughtError), caughtError));
    }
    const loadedOutcome = await this.loadCodefastConfig.execute(rootDir);
    if (!loadedOutcome.ok) {
      return loadedOutcome;
    }
    return ok({ resolvedTarget, rootDir, config: loadedOutcome.value.config });
  }
}
