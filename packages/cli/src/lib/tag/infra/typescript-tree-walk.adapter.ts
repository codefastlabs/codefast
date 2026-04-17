import { walkTsxFiles } from "#/lib/shared/source-code/infra/tsx-file-walk.adapter";
import type { TypeScriptTreeWalkPort } from "#/lib/tag/application/ports/typescript-tree-walk.port";

export const tagTypeScriptTreeWalkAdapter: TypeScriptTreeWalkPort = {
  walkTsxFiles,
};
