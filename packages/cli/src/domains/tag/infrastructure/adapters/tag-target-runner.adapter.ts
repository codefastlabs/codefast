import { inject, injectable } from "@codefast/di";
import type { CliFilesystemPort } from "#/shell/application/ports/outbound/cli-fs.port";
import type { CliPathPort } from "#/shell/application/ports/outbound/cli-path.port";
import type { TypeScriptSourceFileWalkerPort } from "#/shell/application/ports/outbound/typescript-source-file-walker.port";
import {
  CliFilesystemPortToken,
  CliPathPortToken,
  TypeScriptSourceFileWalkerPortToken,
} from "#/shell/application/cli-runtime.tokens";
import type { TagSinceWriterPort } from "#/domains/tag/application/ports/outbound/tag-since-writer.port";
import type { TagVersionResolverPort } from "#/domains/tag/application/ports/outbound/tag-version-resolver.port";
import type { TagTargetRunnerPort } from "#/domains/tag/application/ports/outbound/tag-target-runner.port";
import {
  TagSinceWriterPortToken,
  TagVersionResolverPortToken,
} from "#/domains/tag/composition/tokens";
import type { TagRunOptions, TagRunResult } from "#/domains/tag/domain/types.domain";

@injectable([
  inject(CliFilesystemPortToken),
  inject(CliPathPortToken),
  inject(TagVersionResolverPortToken),
  inject(TagSinceWriterPortToken),
  inject(TypeScriptSourceFileWalkerPortToken),
])
export class TagTargetRunnerAdapter implements TagTargetRunnerPort {
  constructor(
    private readonly fs: CliFilesystemPort,
    private readonly pathService: CliPathPort,
    private readonly versionResolver: TagVersionResolverPort,
    private readonly sinceWriter: TagSinceWriterPort,
    private readonly sourceFileWalker: TypeScriptSourceFileWalkerPort,
  ) {}

  runOnTarget(targetPath: string, opts: TagRunOptions): TagRunResult {
    const resolvedTarget = this.pathService.resolve(targetPath);
    const version = this.versionResolver.resolveNearestPackageVersion(resolvedTarget);

    const files = this.fs.statSync(resolvedTarget).isDirectory()
      ? this.sourceFileWalker.walkTsxFiles(resolvedTarget)
      : [resolvedTarget];
    const tsFiles = files.filter(
      (filePath) => filePath.endsWith(".ts") || filePath.endsWith(".tsx"),
    );

    const fileResults = tsFiles.map((filePath) =>
      this.sinceWriter.applySinceTagsToFile(filePath, version, opts.write),
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
}
