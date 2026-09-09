import path from "node:path";

import type { DirectoryEntry, FilesystemPort } from "#/core/filesystem/port";

/**
 * A {@link FilesystemPort} that reports a pnpm workspace at `rootDir` and treats only the listed paths
 * (plus the root and its `pnpm-workspace.yaml`) as existing. No config file exists, so config loads empty.
 *
 * @since 0.3.16-canary.0
 */
export function createWorkspaceFilesystem(options: {
  readonly rootDir: string;
  readonly existingPaths?: ReadonlyArray<string>;
}): FilesystemPort {
  const existing = new Set<string>([
    options.rootDir,
    path.join(options.rootDir, "pnpm-workspace.yaml"),
    ...(options.existingPaths ?? []),
  ]);

  return {
    existsSync: (filePath) => existing.has(filePath),
    canonicalPathSync: (inputPath) => inputPath,
    statSync: () => ({ isDirectory: () => true, isFile: () => false }),
    readFileSync: () => "",
    writeFileSync: () => {},
    readdirSync: () => [],
    readFile: async () => "",
    writeFile: async () => {},
    readdir: async (): Promise<Array<string> | Array<DirectoryEntry>> => [],
    globSync: () => [],
    rename: async () => {},
    unlink: async () => {},
  };
}

/**
 * A {@link FilesystemPort} where nothing exists, so project-root resolution throws.
 *
 * @since 0.3.16-canary.0
 */
export function createRootlessFilesystem(): FilesystemPort {
  return { ...createWorkspaceFilesystem({ rootDir: "unused" }), existsSync: () => false };
}
