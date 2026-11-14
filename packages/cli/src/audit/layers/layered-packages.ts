import path from "node:path";

import { invalidLayerEntry } from "#audit/layers/domain/layering";
import { AppError } from "#core/errors";
import type { Filesystem } from "#core/filesystem/filesystem";
import type { Result } from "#core/result";
import { err, ok } from "#core/result";
import type { Workspace } from "#core/workspace/workspace";

/**
 * One layered package as the run reads it: its name, the absolute root the layers sit under, and the layers.
 *
 * @since 0.14.0
 */
export type LayersAuditPackage = {
  readonly name: string;
  readonly rootPath: string;
  readonly layers: ReadonlyArray<ReadonlyArray<string>>;
};

const DEFAULT_LAYERS_ROOT = "src";

/**
 * Resolves every package `audit.layers.packages` names to the root its layers sit under, sorted by name.
 *
 * @remarks A configured name no workspace package carries, an entry nested below the root or placed
 * twice, and a root that does not exist are each refused here, before anything is scanned.
 */
export function resolveLayeredPackages(
  fs: Filesystem,
  workspace: Workspace,
): Result<ReadonlyArray<LayersAuditPackage>, AppError> {
  const directoryByName = new Map(workspace.packages.map((candidate) => [candidate.name, candidate.directory]));
  const packages: Array<LayersAuditPackage> = [];
  const section = workspace.config.audit?.layers;
  for (const [name, packageConfig] of Object.entries((section === false ? undefined : section?.packages) ?? {})) {
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
  return ok(packages.toSorted((left, right) => left.name.localeCompare(right.name)));
}
