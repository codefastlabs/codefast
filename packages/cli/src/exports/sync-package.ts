import path from "node:path";

import type { ExportsConfig } from "#core/config/schema";
import { messageFrom } from "#core/errors";
import type { Filesystem } from "#core/filesystem/filesystem";
import { distDirName, packageJsonFileName } from "#core/workspace/well-known-files";
import type { WorkspacePackage } from "#core/workspace/workspace";
import { createDistFilesystem } from "#exports/dist-filesystem-node";
import { createPathTransform, generateExports } from "#exports/domain/exports";
import type { ExportsPackageOutcome } from "#exports/domain/types";
import { buildSourcePathResolver, supplementExportsInPackageJson } from "#exports/supplement-exports";
import { writePackageJsonExportsAtomic } from "#exports/write-exports";

type PackageConfig = Exclude<ExportsConfig[string], false>;

const noExports: ExportsPackageOutcome["exports"] = { total: 0, modules: 0, stylesheets: 0, custom: 0 };

/**
 * Regenerates one package's `package.json#exports` from its `dist/`, writing it unless `write` is off.
 */
export async function syncPackageExports(
  fs: Filesystem,
  workspacePackage: WorkspacePackage,
  packageConfig: PackageConfig | false | undefined,
  write: boolean,
): Promise<ExportsPackageOutcome> {
  const { name, relativeDirectory: directory } = workspacePackage;
  const base = { name, directory, reason: null, files: [], exports: noExports, pruned: [] };
  if (packageConfig === false) {
    return { ...base, status: "skipped", reason: "skipped by the config" };
  }
  const distDir = path.join(workspacePackage.directory, distDirName);
  if (!fs.existsSync(distDir)) {
    return { ...base, status: "skipped", reason: "no dist/ to read — build it first" };
  }

  const packageJsonPath = path.join(workspacePackage.directory, packageJsonFileName);
  const manifestFile = directory === "." ? packageJsonFileName : `${directory}/${packageJsonFileName}`;
  try {
    const exportOptions = {
      source: packageConfig?.source ?? true,
      types: packageConfig?.types ?? true,
      import: packageConfig?.import ?? true,
      ...(packageConfig?.exclude === undefined ? {} : { exclude: packageConfig.exclude }),
      resolveSourcePath: buildSourcePathResolver(fs, workspacePackage.directory),
    };

    if (packageConfig?.preserve) {
      const { supplementedSpecifiers, changed } = await supplementExportsInPackageJson(
        fs,
        packageJsonPath,
        workspacePackage.directory,
        exportOptions,
        write,
      );
      return {
        ...base,
        status: changed ? "changed" : "unchanged",
        files: changed ? [manifestFile] : [],
        exports: { ...noExports, total: supplementedSpecifiers.length },
      };
    }

    const extraExports = packageConfig?.exports ?? {};
    const generated = await generateExports(
      createDistFilesystem(fs),
      distDir,
      createPathTransform(packageConfig?.strip),
      packageConfig?.css,
      extraExports,
      exportOptions,
    );
    const { prunedKeys, changed } = await writePackageJsonExportsAtomic(
      fs,
      packageJsonPath,
      {
        generatedExports: generated.exports,
        managedExportSpecifiers: Object.keys(generated.exports),
        originalPathBySpecifier: generated.originalPathBySpecifier,
      },
      write,
    );
    return {
      ...base,
      status: changed ? "changed" : "unchanged",
      files: changed ? [manifestFile] : [],
      exports: {
        total: Object.keys(generated.exports).length,
        modules: generated.jsCount,
        stylesheets: generated.cssCount,
        custom: Object.keys(extraExports).length,
      },
      pruned: prunedKeys,
    };
  } catch (caughtError: unknown) {
    return { ...base, status: "failed", reason: messageFrom(caughtError) };
  }
}
