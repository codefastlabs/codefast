import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import type { CliPath } from "#/lib/core/application/ports/path.port";
import type { TagSinceWriterPort } from "#/lib/tag/application/ports/tag-since-writer.port";
import type { TypeScriptTreeWalkPort } from "#/lib/tag/application/ports/typescript-tree-walk.port";
import type { TagVersionResolverPort } from "#/lib/tag/application/ports/tag-version-resolver.port";
import type { TagRunOptions, TagRunResult } from "#/lib/tag/domain/types.domain";

export function resolveNearestPackageVersion(
  targetPath: string,
  versionResolver: TagVersionResolverPort,
): string {
  return versionResolver.resolveNearestPackageVersion(targetPath);
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
  const version = resolveNearestPackageVersion(resolvedTarget, versionResolver);

  const files = fs.statSync(resolvedTarget).isDirectory()
    ? typeScriptTreeWalk.walkTsxFiles(resolvedTarget)
    : [resolvedTarget];
  const tsFiles = files.filter((filePath) => filePath.endsWith(".ts") || filePath.endsWith(".tsx"));

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
