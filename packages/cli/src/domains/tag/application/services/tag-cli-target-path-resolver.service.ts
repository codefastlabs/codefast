import path from "node:path";
import { inject, injectable } from "@codefast/di";
import type { CliFs } from "#/shell/application/ports/cli-io.port";
import { CliFsToken } from "#/shell/application/cli-runtime.tokens";
import type { TagCliTargetPathResolverService } from "#/domains/tag/contracts/services.contract";

@injectable([inject(CliFsToken)])
export class TagCliTargetPathResolverServiceImpl implements TagCliTargetPathResolverService {
  constructor(private readonly fs: CliFs) {}

  resolveCliTargetPath(args: {
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
