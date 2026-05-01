export interface TagVersionResolverPort {
  resolveNearestPackageVersion(targetPath: string): string;
}
