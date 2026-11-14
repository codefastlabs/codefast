import { fileScan, findingsIn } from "#audit/domain/findings";
import type { AuditContext, AuditScan } from "#audit/domain/types";
import { findPropsIntersections, judgePropsIntersection } from "#audit/props/domain/props-intersection";
import type { PropsTypeProbe } from "#audit/props/type-probe";
import { createPropsTypeProbe } from "#audit/props/type-probe";
import { AppError, messageFrom } from "#core/errors";
import { relativePosixPath } from "#core/path";
import type { Finding } from "#core/report";
import type { Result } from "#core/result";
import { err, ok } from "#core/result";
import { walkTsxFiles } from "#core/workspace/typescript-walk";

/**
 * Scans the target for component props aliases joined with `&` that an interface could express.
 *
 * @remarks The type server starts only once a file holds a candidate, so a tree without one never spawns it.
 *
 * @since 0.15.0
 */
export async function runPropsAudit(
  { fs, workspace, target }: AuditContext,
  createProbe: () => Promise<Result<PropsTypeProbe, AppError>> = createPropsTypeProbe,
): Promise<Result<AuditScan, AppError>> {
  let probe: PropsTypeProbe | undefined;
  try {
    const files = walkTsxFiles(target.path, fs);
    const findings: Array<Finding> = [];
    for (const filePath of files) {
      const intersections = findPropsIntersections(filePath, fs.readFileSync(filePath, "utf8"));
      if (intersections.length === 0) {
        continue;
      }
      if (probe === undefined) {
        const created = await createProbe();
        if (!created.ok) {
          return created;
        }
        probe = created.value;
      }
      const classify = probe.forFile(filePath);
      const detections = intersections
        .map((intersection) => judgePropsIntersection(intersection, classify(intersection.parts)))
        .filter((detection) => detection !== undefined);
      findings.push(...findingsIn(relativePosixPath(workspace.rootDir, filePath), detections));
    }
    return ok(fileScan(findings, files.length));
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  } finally {
    probe?.dispose();
  }
}
