/**
 * How workspace package directories were derived (pnpm-workspace.yaml vs defaults).
 * Aligns with mirror `WorkspaceMultiDiscoverySource` for logging/telemetry.
 */
export type WorkspacePackageLayoutSource =
  | "default-patterns"
  | "pnpm-workspace-yaml"
  | "declared-empty";

export type WorkspacePackageLayoutOutcome = {
  /** Absolute paths to directories that contain a `package.json`. Sorted. */
  readonly packageDirectoryPathsAbsolute: readonly string[];
  readonly layoutSource: WorkspacePackageLayoutSource;
  /** `true` when `pnpm-workspace.yaml` exists under the repo root. */
  readonly hasPnpmWorkspaceYamlFile: boolean;
};

/**
 * Lists workspace packages using the same rules as pnpm: `pnpm-workspace.yaml` `packages`
 * patterns (with `!` excludes) and glob of `…/package.json`.
 */
export interface WorkspacePackageLayoutPort {
  listPackageDirectoryPathsAbsolute(
    rootDirectoryPathAbsolute: string,
    onGlobPermissionIssue: (diagnosticLine: string) => void,
  ): Promise<WorkspacePackageLayoutOutcome>;
}
