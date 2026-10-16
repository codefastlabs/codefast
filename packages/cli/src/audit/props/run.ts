import path from "node:path";

import type { PropsAuditResult, PropsFileViolations } from "#audit/domain/types";
import { findPropsIntersections, judgePropsIntersection } from "#audit/props/domain/props-intersection";
import type { PropsTypeProbe } from "#audit/props/type-probe";
import { createPropsTypeProbe } from "#audit/props/type-probe";
import { AppError, messageFrom } from "#core/errors";
import type { Filesystem } from "#core/filesystem/filesystem";
import type { Result } from "#core/result";
import { err, ok } from "#core/result";
import { walkTsxFiles } from "#core/workspace/typescript-walk";

/**
 * Scans a target path for component props aliases joined with `&` that an interface could express.
 *
 * @remarks The type server starts only once a file holds a candidate, so a tree without one never spawns it.
 */
export async function runPropsAudit(
  fs: Filesystem,
  args: {
    readonly rootDir: string;
    readonly targetPath: string;
    readonly allowlist: ReadonlyArray<string>;
  },
  createProbe: () => Promise<PropsTypeProbe> = createPropsTypeProbe,
): Promise<Result<PropsAuditResult, AppError>> {
  let probe: PropsTypeProbe | undefined;
  try {
    const allowlist = new Set(args.allowlist);
    const { rootDir, targetPath } = args;
    const filesToScan = fs.statSync(targetPath).isFile() ? [targetPath] : walkTsxFiles(targetPath, fs);
    const files: Array<PropsFileViolations> = [];
    let violationCount = 0;
    let allowlistedCount = 0;

    for (const absolutePath of filesToScan) {
      const intersections = findPropsIntersections(absolutePath, fs.readFileSync(absolutePath, "utf8"));
      if (intersections.length === 0) {
        continue;
      }
      probe ??= await createProbe();
      const classify = probe.forFile(absolutePath);
      const relativePath = path.relative(rootDir, absolutePath).split(path.sep).join("/");
      const remaining = intersections
        .map((intersection) => judgePropsIntersection(intersection, classify(intersection.parts)))
        .filter((violation) => violation !== undefined)
        .filter(({ raw }) => {
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

    return ok({ files, violationCount, allowlistedCount, scannedFileCount: filesToScan.length });
  } catch (caughtError: unknown) {
    return err(
      caughtError instanceof AppError
        ? caughtError
        : new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError),
    );
  } finally {
    probe?.dispose();
  }
}
