import type { CliFs } from "#/lib/core/application/ports/cli-io.port";

/** Lists `.ts` / `.tsx` files under a directory (implementation may live in another bounded context’s infra). */
export type TypeScriptTreeWalkPort = {
  walkTsxFiles(rootDirectoryPath: string, fs: CliFs): string[];
};
