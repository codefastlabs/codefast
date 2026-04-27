import { inject, injectable } from "@codefast/di";
import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import type { CliPath } from "#/lib/core/application/ports/path.port";
import { CliFsToken, CliPathToken } from "#/lib/core/contracts/tokens";
import type { TagVersionResolverPort } from "#/lib/tag/application/ports/tag-version-resolver.port";

const PACKAGE_JSON = "package.json";

@injectable([inject(CliPathToken), inject(CliFsToken)])
export class TagVersionResolverAdapter implements TagVersionResolverPort {
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
      const packageJsonPath = this.path.join(current, PACKAGE_JSON);
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

    throw new Error(`Unable to locate ${PACKAGE_JSON} from target: ${targetPath}`);
  }
}
