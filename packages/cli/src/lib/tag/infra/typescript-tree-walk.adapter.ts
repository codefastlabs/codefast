import { inject, injectable } from "@codefast/di";
import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import { CliFsToken } from "#/lib/core/contracts/tokens";
import { walkTsxFiles } from "#/lib/shared/source-code/infra/tsx-file-walk.adapter";
import type { TypeScriptTreeWalkPort } from "#/lib/tag/application/ports/typescript-tree-walk.port";

@injectable([inject(CliFsToken)])
export class TypeScriptTreeWalkAdapter implements TypeScriptTreeWalkPort {
  constructor(private readonly fs: CliFs) {}

  walkTsxFiles(rootDirectoryPath: string): string[] {
    return walkTsxFiles(rootDirectoryPath, this.fs);
  }
}
