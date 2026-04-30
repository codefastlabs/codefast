import { realpathSync } from "node:fs";
import path from "node:path";
import { injectable } from "@codefast/di";
import type { PackageFilterPathResolverPort } from "#/domains/mirror/application/ports/package-filter-path-resolver.port";
import { normalizePath } from "#/domains/mirror/domain/path-normalizer.value-object";

/**
 * Resolve `packageFilter` to a POSIX-ish path relative to `rootDir`, without using
 * `process.cwd()`. Use for programmatic `runMirrorSync` calls.
 *
 * @throws If the resolved path is not a strict subdirectory of `rootDir`.
 */
@injectable()
export class PackageFilterPathResolver implements PackageFilterPathResolverPort {
  resolvePackageFilterUnderRoot(rootDir: string, packageFilter: string): string {
    const rootResolved = path.resolve(rootDir);
    const rootReal = this.tryRealpath(rootResolved);
    const resolved = path.isAbsolute(packageFilter)
      ? this.tryRealpath(path.resolve(packageFilter))
      : this.tryRealpath(path.join(rootReal, packageFilter));
    const rel = path.relative(rootReal, resolved);
    const normalized = normalizePath(rel);
    if (
      normalized.startsWith("..") ||
      path.isAbsolute(normalized) ||
      normalized === "" ||
      normalized === "."
    ) {
      throw new Error(`Package path must be a subdirectory under monorepo root: ${rootDir}`);
    }
    return normalized;
  }

  private tryRealpath(entryPath: string): string {
    try {
      return realpathSync.native(entryPath);
    } catch {
      return path.resolve(entryPath);
    }
  }
}
