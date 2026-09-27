import path from "node:path";

import type { LayersAuditPackage } from "#audit/layers/cli-schema";
import { invalidLayerEntry } from "#audit/layers/domain/layering";
import type { AuditCommandPrelude } from "#audit/prepare";
import { prepareRepoRootAuditWith } from "#audit/prepare";
import { AppError, messageFrom } from "#core/errors";
import type { Filesystem } from "#core/filesystem/filesystem";
import type { Result } from "#core/result";
import { err, ok } from "#core/result";
import { listWorkspacePackageDirectories } from "#core/workspace/resolver";
import { packageJsonFileName } from "#core/workspace/well-known-files";

const DEFAULT_LAYERS_ROOT = "src";

/**
 * The shared audit prelude plus the layered packages `audit.layers.packages` names, resolved to their roots.
 *
 * @since 0.14.0
 */
export type LayersAuditPrelude = AuditCommandPrelude & {
  readonly packages: ReadonlyArray<LayersAuditPackage>;
};

async function workspacePackageDirectoriesByName(rootDir: string, fs: Filesystem): Promise<Map<string, string>> {
  const layout = await listWorkspacePackageDirectories(rootDir, fs, true);
  const byName = new Map<string, string>();
  for (const directory of layout.packageDirectoryPathsAbsolute) {
    const manifestPath = path.join(directory, packageJsonFileName);
    if (!fs.existsSync(manifestPath)) {
      continue;
    }
    const manifest: unknown = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    if (typeof manifest === "object" && manifest !== null && "name" in manifest && typeof manifest.name === "string") {
      byName.set(manifest.name, directory);
    }
  }
  return byName;
}

/**
 * Loads config and resolves every package `audit.layers.packages` names to the root its layers sit under.
 *
 * @remarks A configured name no workspace package carries, an entry nested below the root or placed
 * twice, and a root that does not exist are each reported here, before anything is scanned.
 *
 * @since 0.14.0
 */
export async function prepareLayersAudit(
  fs: Filesystem,
  args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  },
): Promise<Result<LayersAuditPrelude, AppError>> {
  return prepareRepoRootAuditWith(fs, args, async (config, rootDir) => {
    const layersConfig = config.audit?.layers;
    const allowlist = layersConfig?.allowlist ?? [];
    const configured = Object.entries(layersConfig?.packages ?? {});
    if (configured.length === 0) {
      return ok({ allowlist, packages: [] });
    }

    let directoryByName: Map<string, string>;
    try {
      directoryByName = await workspacePackageDirectoriesByName(rootDir, fs);
    } catch (caughtError: unknown) {
      return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
    }

    const packages: Array<LayersAuditPackage> = [];
    for (const [name, packageConfig] of configured) {
      const directory = directoryByName.get(name);
      if (directory === undefined) {
        return err(
          new AppError("VALIDATION_ERROR", `audit.layers.packages["${name}"]: no workspace package has that name`),
        );
      }
      const invalid = invalidLayerEntry(packageConfig.layers);
      if (invalid !== undefined) {
        return err(new AppError("VALIDATION_ERROR", `audit.layers.packages["${name}"]: ${invalid}`));
      }
      const rootPath = path.join(directory, packageConfig.root ?? DEFAULT_LAYERS_ROOT);
      if (!fs.existsSync(rootPath)) {
        return err(new AppError("NOT_FOUND", `Not found: ${rootPath}`));
      }
      packages.push({ name, rootPath: fs.canonicalPathSync(rootPath), layers: packageConfig.layers });
    }
    packages.sort((left, right) => left.name.localeCompare(right.name));

    return ok({ allowlist, packages });
  });
}
