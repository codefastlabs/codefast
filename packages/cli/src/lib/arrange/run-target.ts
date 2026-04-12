import type { CliFs, CliLogger } from "#lib/infra/fs-contract";
import { ArrangeError, ArrangeErrorCode } from "#lib/arrange/errors";
import type { ArrangeRunOnTargetOptions } from "#lib/arrange/types";
import { groupFile } from "#lib/arrange/group-file";
import { walkTsxFiles } from "#lib/arrange/walk";

export function runOnTarget(
  target: string,
  options: ArrangeRunOnTargetOptions,
  fs: CliFs,
  logger: CliLogger,
): void {
  const { out } = logger;
  if (!fs.existsSync(target)) {
    throw new ArrangeError(ArrangeErrorCode.TARGET_NOT_FOUND, `Not found: ${target}`);
  }

  const filePaths = fs.statSync(target).isDirectory() ? walkTsxFiles(target, fs) : [target];

  let totalFound = 0;
  let totalChanged = 0;

  for (const fp of filePaths) {
    const result = groupFile(fp, options, fs, logger);
    totalFound += result.totalFound;
    totalChanged += result.changed;
  }

  out(
    `\nTotal: ${filePaths.length} file(s), ${totalFound} site(s) (cn/tv/JSX className) to review.`,
  );
  if (options.write) {
    out(`Applied: ${totalChanged} site(s) updated.`);
  } else {
    out(
      `(Run "apply" to write changes, or "pnpm cli:arrange-apply" / "pnpm exec codefast arrange apply")`,
    );
  }

  const showCascadeHint = options.write ? totalChanged > 0 : totalFound > 0;
  if (showCascadeHint) {
    out(
      "Note: class order may change across concern groups — smoke-test the UI if you rely on cascade order.",
    );
  }
}
