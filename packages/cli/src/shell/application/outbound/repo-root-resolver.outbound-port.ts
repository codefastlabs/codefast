export interface RepoRootResolverPort {
  findRepoRoot(fromDirectory: string): string;
}
