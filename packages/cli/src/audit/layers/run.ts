import path from "node:path";

import type { LayerFileViolations, LayersAuditResult } from "#audit/domain/types";
import type { LayersAuditPackage } from "#audit/layers/cli-schema";
import { auditLayeringSource, LayerMap } from "#audit/layers/domain/layering";
import { AppError, messageFrom } from "#core/errors";
import type { Filesystem } from "#core/filesystem/filesystem";
import type { Result } from "#core/result";
import { err, ok } from "#core/result";
import { walkTsxFiles } from "#core/workspace/typescript-walk";

/**
 * Scans every layered package the target reaches for value imports that point up its layers.
 *
 * @remarks The target narrows the scan: the repo root reaches every package, a package directory
 * reaches that package, and a path under a package's root reaches the modules beneath it.
 */
export function runLayersAudit(
  fs: Filesystem,
  args: {
    readonly rootDir: string;
    readonly targetPath: string;
    readonly allowlist: ReadonlyArray<string>;
    readonly packages: ReadonlyArray<LayersAuditPackage>;
  },
): Result<LayersAuditResult, AppError> {
  try {
    const allowlist = new Set(args.allowlist);
    const files: Array<LayerFileViolations> = [];
    let violationCount = 0;
    let allowlistedCount = 0;
    let scannedFileCount = 0;
    let packageCount = 0;

    for (const layeredPackage of args.packages) {
      const targetInsideRoot = isWithin(layeredPackage.rootPath, args.targetPath);
      if (!targetInsideRoot && !isWithin(args.targetPath, layeredPackage.rootPath)) {
        continue;
      }
      packageCount++;
      const layers = new LayerMap(layeredPackage.layers);
      const scanRoot = targetInsideRoot ? args.targetPath : layeredPackage.rootPath;
      const filesToScan = fs.statSync(scanRoot).isFile() ? [scanRoot] : walkTsxFiles(scanRoot, fs);

      for (const absolutePath of filesToScan) {
        scannedFileCount++;
        const relativePath = toPosixPath(path.relative(args.rootDir, absolutePath));
        const modulePath = toPosixPath(path.relative(layeredPackage.rootPath, absolutePath));
        const content = fs.readFileSync(absolutePath, "utf8");
        const remaining = auditLayeringSource(absolutePath, modulePath, content, layers).filter(({ raw }) => {
          const isAllowed = allowlist.has(raw) || allowlist.has(`${relativePath}:${raw}`);
          if (isAllowed) {
            allowlistedCount++;
          }
          return !isAllowed;
        });
        if (remaining.length === 0) {
          continue;
        }
        violationCount += remaining.length;
        files.push({ relativePath, violations: remaining });
      }
    }

    return ok({ files, violationCount, allowlistedCount, scannedFileCount, packageCount });
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }
}

function isWithin(parentPath: string, childPath: string): boolean {
  const relative = path.relative(parentPath, childPath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}
