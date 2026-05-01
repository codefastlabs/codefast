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
  /**
   * When `suppressGlobPermissionDiagnostics` is true (e.g. `--json`), EACCES/EPERM during workspace
   * globs are skipped silently; otherwise a line is logged via injected `CliLoggerPort`.
   */
  listPackageDirectoryPathsAbsolute(
    rootDirectoryPathAbsolute: string,
    suppressGlobPermissionDiagnostics?: boolean,
  ): Promise<WorkspacePackageLayoutOutcome>;
}
