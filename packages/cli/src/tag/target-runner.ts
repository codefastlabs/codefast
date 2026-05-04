import path from "node:path";
import type { FilesystemPort } from "#/core/filesystem/port";
import { walkTsxFiles } from "#/core/workspace/typescript-walk";
import type { TagRunOptions, TagRunResult } from "#/tag/domain/types";
import { resolveNearestPackageVersion } from "#/tag/version-resolver";
import { TagSinceWriter } from "#/tag/since-writer";

/**
 * @since 0.3.16-canary.0
 */
export function runTagOnTarget(
  fs: FilesystemPort,
  targetPath: string,
  opts: TagRunOptions,
): TagRunResult {
  const resolvedTarget = path.resolve(targetPath);
  const version = resolveNearestPackageVersion(fs, resolvedTarget);

  const files = fs.statSync(resolvedTarget).isDirectory()
    ? walkTsxFiles(resolvedTarget, fs)
    : [resolvedTarget];
  const tsFiles = files.filter((filePath) => filePath.endsWith(".ts") || filePath.endsWith(".tsx"));

  const sinceWriter = new TagSinceWriter(fs);
  const fileResults = tsFiles.map((filePath) =>
    sinceWriter.applySinceTagsToFile(filePath, version, opts.write),
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
