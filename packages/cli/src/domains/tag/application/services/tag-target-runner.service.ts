import { inject, injectable } from "@codefast/di";
import type { CliFs } from "#/shell/application/outbound/cli-io.outbound-port";
import type { CliPath } from "#/shell/application/outbound/cli-path.outbound-port";
import type { TypeScriptSourceFileWalkerPort } from "#/shell/application/outbound/typescript-source-file-walker.outbound-port";
import {
  CliFsToken,
  CliPathToken,
  TypeScriptSourceFileWalkerPortToken,
} from "#/shell/application/cli-runtime.tokens";
import type { TagSinceWriterPort } from "#/domains/tag/application/outbound/tag-since-writer.outbound-port";
import type { TagVersionResolverPort } from "#/domains/tag/application/outbound/tag-version-resolver.outbound-port";
import type { TagTargetRunnerService } from "#/domains/tag/contracts/services.contract";
import {
  TagSinceWriterPortToken,
  TagVersionResolverPortToken,
} from "#/domains/tag/contracts/tokens";
import type { TagRunOptions, TagRunResult } from "#/domains/tag/domain/types.domain";

@injectable([
  inject(CliFsToken),
  inject(CliPathToken),
  inject(TagVersionResolverPortToken),
  inject(TagSinceWriterPortToken),
  inject(TypeScriptSourceFileWalkerPortToken),
])
export class TagTargetRunnerServiceImpl implements TagTargetRunnerService {
  constructor(
    private readonly fs: CliFs,
    private readonly pathService: CliPath,
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
