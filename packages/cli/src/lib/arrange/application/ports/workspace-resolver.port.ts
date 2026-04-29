export interface WorkspaceResolverPort {
  findRepoRoot(fromDirectory: string): string;
}
