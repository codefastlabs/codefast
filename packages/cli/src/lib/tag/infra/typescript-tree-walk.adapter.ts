import { injectable } from "@codefast/di";
import { walkTsxFiles } from "#/lib/shared/source-code/infra/tsx-file-walk.adapter";
import type { TypeScriptTreeWalkPort } from "#/lib/tag/application/ports/typescript-tree-walk.port";

@injectable([])
export class TypeScriptTreeWalkAdapter implements TypeScriptTreeWalkPort {
  walkTsxFiles = walkTsxFiles;
}
