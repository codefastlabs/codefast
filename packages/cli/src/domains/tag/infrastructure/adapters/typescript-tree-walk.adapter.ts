import { inject, injectable } from "@codefast/di";
import { TypeScriptSourceFileWalkerPortToken } from "#/shell/application/cli-runtime.tokens";
import type { TypeScriptSourceFileWalkerPort } from "#/shell/application/ports/typescript-source-file-walker.port";
import type { TypeScriptTreeWalkPort } from "#/domains/tag/application/ports/typescript-tree-walk.port";

@injectable([inject(TypeScriptSourceFileWalkerPortToken)])
export class TypeScriptTreeWalkAdapter implements TypeScriptTreeWalkPort {
  constructor(private readonly sourceFileWalker: TypeScriptSourceFileWalkerPort) {}

  walkTsxFiles(rootDirectoryPath: string): string[] {
    return this.sourceFileWalker.walkTsxFiles(rootDirectoryPath);
  }
}
