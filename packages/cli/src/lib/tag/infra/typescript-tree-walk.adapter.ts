import { walkTsxFiles } from "#lib/arrange/infra/walk";
import type { TypeScriptTreeWalkPort } from "#lib/tag/application/ports/typescript-tree-walk.port";

export const tagTypeScriptTreeWalkAdapter: TypeScriptTreeWalkPort = {
  walkTsxFiles,
};
