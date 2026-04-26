/**
 * Lists `.ts` / `.tsx` files under a directory (implementation may live in another bounded context’s infra).
 */
export interface TypeScriptTreeWalkPort {
  walkTsxFiles(rootDirectoryPath: string): string[];
}
