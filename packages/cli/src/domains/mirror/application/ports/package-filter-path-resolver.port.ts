export interface PackageFilterPathResolverPort {
  resolvePackageFilterUnderRoot(rootDir: string, packageFilter: string): string;
}
