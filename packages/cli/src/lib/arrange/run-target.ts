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
    throw new ArrangeError(ArrangeErrorCode.TARGET_NOT_FOUND, `Không tìm thấy: ${target}`);
  }

  const filePaths = fs.statSync(target).isDirectory() ? walkTsxFiles(target, fs) : [target];

  let totalFound = 0;
  let totalChanged = 0;

  for (const fp of filePaths) {
    const result = groupFile(fp, options, fs, logger);
    totalFound += result.totalFound;
    totalChanged += result.changed;
  }

  out(`\nTổng: ${filePaths.length} file, ${totalFound} vị trí (cn/tv/JSX className) cần xem xét.`);
  if (options.write) {
    out(`Đã áp dụng: ${totalChanged} vị trí được cập nhật.`);
  } else {
    out(
      `(Chạy "apply" để ghi đè, hoặc "pnpm cli:arrange-apply" / "pnpm exec codefast arrange apply")`,
    );
  }

  const showCascadeHint = options.write ? totalChanged > 0 : totalFound > 0;
  if (showCascadeHint) {
    out(
      "Lưu ý: thứ tự class có thể đổi giữa các nhóm concern — smoke-test UI nếu có xung đột cascade.",
    );
  }
}
