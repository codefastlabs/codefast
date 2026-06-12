import path from "node:path";

import { messageFrom } from "#/core/errors";
import type { FilesystemPort } from "#/core/filesystem/port";
import { logger } from "#/core/logger";
import { walkTsxFiles } from "#/core/workspace/typescript-walk";

const TEST_FILE_PATTERN = /\.(?:test|spec)\.[cm]?[jt]sx?$/;

/**
 * Test/spec files are excluded from directory scans: arrange rewrites class strings,
 * and a `cn(...)` inside an assertion (e.g. `expect(cn("a", "b"))`) is intentional test
 * data, not styling to reformat. An explicit single-file target is still honored.
 */
function isTestFile(filePath: string): boolean {
  return TEST_FILE_PATTERN.test(path.basename(filePath));
}

/**
 * @since 0.3.16-canary.0
 */
export function scanArrangeTargets(fs: FilesystemPort, targetPath: string): Array<string> {
  const resolvedTargetPath = path.resolve(targetPath);
  if (fs.statSync(resolvedTargetPath).isDirectory()) {
    try {
      return walkTsxFiles(resolvedTargetPath, fs).filter((filePath) => !isTestFile(filePath));
    } catch (caughtError: unknown) {
      logger.err(`[file-walker] ${messageFrom(caughtError)}`);
      throw caughtError;
    }
  }
  return [resolvedTargetPath];
}
