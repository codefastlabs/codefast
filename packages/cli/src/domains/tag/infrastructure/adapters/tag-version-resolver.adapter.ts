import { inject, injectable } from "@codefast/di";
import type { FilesystemPort } from "#/shell/application/ports/outbound/cli-fs.port";
import type { CliPathPort } from "#/shell/application/ports/outbound/cli-path.port";
import { CliFilesystemPortToken, CliPathPortToken } from "#/shell/application/cli-runtime.tokens";
import type { TagVersionResolverPort } from "#/domains/tag/application/ports/outbound/tag-version-resolver.port";

@injectable([inject(CliPathPortToken), inject(CliFilesystemPortToken)])
export class TagVersionResolverAdapter implements TagVersionResolverPort {
  private readonly packageJsonFileName = "package.json";

  constructor(
    private readonly path: CliPathPort,
    private readonly fs: FilesystemPort,
  ) {}

  resolveNearestPackageVersion(targetPath: string): string {
    const resolved = this.path.resolve(targetPath);
    const startDir = this.fs.statSync(resolved).isDirectory()
      ? resolved
      : this.path.dirname(resolved);

    let current = startDir;
    while (true) {
      const packageJsonPath = this.path.join(current, this.packageJsonFileName);
      if (this.fs.existsSync(packageJsonPath)) {
        const raw = this.fs.readFileSync(packageJsonPath, "utf8");
        const version = (JSON.parse(raw) as { version?: unknown }).version;
        if (typeof version === "string" && version.length > 0) {
          return version;
        }
        throw new Error(`Missing or invalid version in ${packageJsonPath}`);
      }

      const parent = this.path.dirname(current);
      if (parent === current) {
        break;
      }
      current = parent;
    }

    throw new Error(`Unable to locate ${this.packageJsonFileName} from target: ${targetPath}`);
  }
}
