import path from "node:path";
import { inject, injectable } from "@codefast/di";
import type { CliFilesystemPort } from "#/shell/application/ports/outbound/cli-fs.port";
import { CliFilesystemPortToken } from "#/shell/application/cli-runtime.tokens";
import type { TagTargetPathResolverPort } from "#/domains/tag/application/ports/outbound/tag-target-path-resolver.port";

@injectable([inject(CliFilesystemPortToken)])
export class TagTargetPathResolverAdapter implements TagTargetPathResolverPort {
  constructor(private readonly fs: CliFilesystemPort) {}

  resolveProvidedTargetPath(args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  }): string | undefined {
    if (args.rawTarget === undefined) {
      return undefined;
    }
    const candidate = path.isAbsolute(args.rawTarget)
      ? path.resolve(args.rawTarget)
      : path.resolve(args.currentWorkingDirectory, args.rawTarget);
    return this.fs.canonicalPathSync(candidate);
  }
}
