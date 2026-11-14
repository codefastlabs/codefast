import { findingsIn } from "#audit/domain/findings";
import type { AuditContext, AuditScan } from "#audit/domain/types";
import { auditLayeringSource, LayerMap } from "#audit/layers/domain/layering";
import { resolveLayeredPackages } from "#audit/layers/layered-packages";
import { AppError, messageFrom } from "#core/errors";
import { isWithinDirectory, relativePosixPath } from "#core/path";
import type { Finding } from "#core/report";
import type { Result } from "#core/result";
import { err, ok } from "#core/result";
import { walkTsxFiles } from "#core/workspace/typescript-walk";

/**
 * Scans every layered package the target reaches for value imports that point up its layers.
 *
 * @remarks The target narrows the scan: the repo root reaches every package, a package directory
 * reaches that package, and a path under a package's root reaches the modules beneath it.
 *
 * @since 0.14.0
 */
export function runLayersAudit({ fs, workspace, target }: AuditContext): Result<AuditScan, AppError> {
  const layered = resolveLayeredPackages(fs, workspace);
  if (!layered.ok) {
    return layered;
  }
  try {
    const findings: Array<Finding> = [];
    let scannedFiles = 0;
    let scannedPackages = 0;
    for (const layeredPackage of layered.value) {
      const targetInsideRoot = isWithinDirectory(layeredPackage.rootPath, target.path);
      if (!targetInsideRoot && !isWithinDirectory(target.path, layeredPackage.rootPath)) {
        continue;
      }
      scannedPackages++;
      const layers = new LayerMap(layeredPackage.layers);
      const files = walkTsxFiles(targetInsideRoot ? target.path : layeredPackage.rootPath, fs);
      scannedFiles += files.length;
      for (const filePath of files) {
        const modulePath = relativePosixPath(layeredPackage.rootPath, filePath);
        const detections = auditLayeringSource(filePath, modulePath, fs.readFileSync(filePath, "utf8"), layers);
        findings.push(...findingsIn(relativePosixPath(workspace.rootDir, filePath), detections));
      }
    }
    return ok({ findings, scannedFiles, scannedPackages, fixedFiles: [] });
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }
}
