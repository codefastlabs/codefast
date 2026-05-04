import path from "node:path";
import type { FilesystemPort } from "#/core/filesystem/port";
import { walkTsxFiles } from "#/core/workspace/typescript-walk";
import { logger } from "#/core/logger";
import { messageFrom } from "#/core/errors";

/**
 * @since 0.3.16-canary.0
 */
export function scanArrangeTargets(fs: FilesystemPort, targetPath: string): string[] {
  const resolvedTargetPath = path.resolve(targetPath);
  if (fs.statSync(resolvedTargetPath).isDirectory()) {
    try {
      return walkTsxFiles(resolvedTargetPath, fs);
    } catch (caughtError: unknown) {
      logger.err(`[file-walker] ${messageFrom(caughtError)}`);
      throw caughtError;
    }
  }
  return [resolvedTargetPath];
}
