/** Lists the files a package's slimmed tarball ships, read from disk. */

import path from "node:path";

import type { Filesystem } from "#core/filesystem/filesystem";
import { isSourceMapFile, slimPublishManifest } from "#pack-slim/domain/transform";

/**
 * What a package's tarball ships, plus the `files` entries that match nothing on disk.
 */
export interface ShippedFiles {
  /** Package-relative POSIX paths, sorted. */
  readonly files: Array<string>;
  readonly missingEntries: Array<string>;
}

/**
 * Lists the files a package ships once the publish step has slimmed it, or `null` with no `files` field to go by.
 *
 * @remarks Applies the same slim as `pack-slim`, so a subtree it drops is absent here too, and leaves out source maps,
 * which the publish step deletes. Without a `files` field npm ships the whole directory, which leaves nothing to judge.
 */
export function listShippedFiles(
  fs: Filesystem,
  packageDir: string,
  manifest: Record<string, unknown>,
): ShippedFiles | null {
  const { manifest: slimmed } = slimPublishManifest(manifest);
  if (!Array.isArray(slimmed.files)) {
    return null;
  }

  const files = new Set<string>();
  const missingEntries: Array<string> = [];
  for (const entry of slimmed.files) {
    if (typeof entry !== "string" || entry.startsWith("!")) {
      continue;
    }
    // An entry names a file, a directory whose whole subtree ships, or a glob.
    const matches = [...fs.globSync(entry, { cwd: packageDir }), ...fs.globSync(`${entry}/**`, { cwd: packageDir })];
    if (matches.length === 0) {
      missingEntries.push(entry);
      continue;
    }
    for (const match of matches) {
      if (fs.statSync(path.join(packageDir, match)).isFile()) {
        files.add(match.split(path.sep).join("/"));
      }
    }
  }

  return { files: [...files].filter((file) => !isSourceMapFile(file)).sort(), missingEntries };
}
