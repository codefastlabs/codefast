import { inject, injectable } from "@codefast/di";
import type { CliFs } from "#/shell/application/ports/cli-io.port";
import { CliFsToken } from "#/shell/application/cli-runtime.tokens";
import { walkTsxFiles } from "#/shell/infrastructure/source-code/infrastructure/typescript-source-file-walker.service";
import type { TypeScriptTreeWalkPort } from "#/domains/tag/application/ports/typescript-tree-walk.port";

@injectable([inject(CliFsToken)])
export class TypeScriptTreeWalkAdapter implements TypeScriptTreeWalkPort {
  constructor(private readonly fs: CliFs) {}

  walkTsxFiles(rootDirectoryPath: string): string[] {
    return walkTsxFiles(rootDirectoryPath, this.fs);
  }
}
