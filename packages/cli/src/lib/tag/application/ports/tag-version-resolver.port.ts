import type { CliFs } from "#/lib/core/application/ports/cli-io.port";

export interface TagVersionResolverPort {
  resolveNearestPackageVersion(targetPath: string, fs: CliFs): string;
}
