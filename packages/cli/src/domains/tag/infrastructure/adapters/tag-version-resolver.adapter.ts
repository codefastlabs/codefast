import { inject, injectable } from "@codefast/di";
import type { CliFs } from "#/shell/application/outbound/cli-io.outbound-port";
import type { CliPath } from "#/shell/application/outbound/cli-path.outbound-port";
import { CliFsToken, CliPathToken } from "#/shell/application/cli-runtime.tokens";
import type { TagVersionResolverPort } from "#/domains/tag/application/outbound/tag-version-resolver.outbound-port";

@injectable([inject(CliPathToken), inject(CliFsToken)])
export class TagVersionResolverAdapter implements TagVersionResolverPort {
  private readonly packageJsonFileName = "package.json";

  constructor(
    private readonly path: CliPath,
    private readonly fs: CliFs,
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
