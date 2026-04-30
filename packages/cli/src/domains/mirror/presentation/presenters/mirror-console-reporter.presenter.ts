import { messageFromCaughtUnknown } from "#/shell/domain/caught-unknown-message.value-object";
import type { CliLogger } from "#/shell/application/ports/cli-io.port";
import type {
  GlobalStats,
  PackageStats,
  WorkspaceMultiDiscoverySource,
} from "#/domains/mirror/domain/types.domain";

const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  magenta: "\x1b[35m",
  brightGreen: "\x1b[92m",
  brightCyan: "\x1b[96m",
};

let colorsEnabled = true;

function color(value: string, code: string): string {
  if (!colorsEnabled) {
    return value;
  }
  return `${code}${value}${COLORS.reset}`;
}

export function configureMirrorColors(noColor: boolean, isStdoutTty: boolean): void {
  colorsEnabled = isStdoutTty && !noColor;
}

type MirrorProcessingMode =
  | { kind: "single" }
  | { kind: "multi"; source: WorkspaceMultiDiscoverySource };

export function mirrorBanner(logger: CliLogger): void {
  logger.out(`\n${color("📦 Mirror — package exports", COLORS.bold + COLORS.cyan)}`);
  logger.out(`${color("═".repeat(60), COLORS.dim)}\n`);
}

export function mirrorProcessingMode(logger: CliLogger, mode: MirrorProcessingMode): void {
  if (mode.kind === "single") {
    logger.out(`${color("Processing single package...", COLORS.dim)}\n`);
    return;
  }
  if (mode.source === "default-patterns") {
    logger.out(
      `${color("Discovering workspace packages using default patterns (packages/*)…", COLORS.dim)}\n`,
    );
    return;
  }
  if (mode.source === "pnpm-workspace-yaml") {
    logger.out(
      `${color("Discovering workspace packages from pnpm-workspace.yaml…", COLORS.dim)}\n`,
    );
    return;
  }
  logger.out(
    `${color("pnpm-workspace.yaml declares an empty workspace package list.", COLORS.dim)}\n`,
  );
}

export function mirrorNoPackages(logger: CliLogger): void {
  logger.out(color("⚠ No packages found", COLORS.yellow));
}

export function logSkippedWorkspacePackage(
  logger: CliLogger,
  index: number,
  total: number,
  displayName: string,
  reason: string,
): void {
  const progress = color(`[${index}/${total}]`, COLORS.dim);
  logger.out(`${progress} ${color("○", COLORS.gray)} ${color(displayName, COLORS.dim)}`);
  logger.out(`  ${color("└─", COLORS.dim)} ${color(`Skipped: ${reason}`, COLORS.gray)}`);
  logger.out("");
}

export function logPackageSuccess(
  logger: CliLogger,
  index: number,
  total: number,
  packageStats: PackageStats,
  generatedDistAssetCounts: { jsCount: number; cssCount: number },
  verbose: boolean,
): void {
  const progress = color(`[${index}/${total}]`, COLORS.dim);
  logger.out(
    `${progress} ${color("✓", COLORS.brightGreen)} ${color(packageStats.name, COLORS.bold)}`,
  );

  if (verbose) {
    logger.out(`  ${color("├─", COLORS.dim)} Path: ${packageStats.path}`);
    if (packageStats.hasTransform) {
      logger.out(
        `  ${color("├─", COLORS.dim)} ${color("Custom path transformation", COLORS.cyan)}`,
      );
    }
    if (packageStats.cssConfigStatus) {
      const status =
        packageStats.cssConfigStatus === "disabled" ? "CSS disabled" : "CSS configured";
      logger.out(`  ${color("├─", COLORS.dim)} ${color(status, COLORS.cyan)}`);
    }
  }

  const breakdown: string[] = [];
  if (generatedDistAssetCounts.jsCount > 0) {
    breakdown.push(color(`${generatedDistAssetCounts.jsCount} modules`, COLORS.green));
  }
  if (generatedDistAssetCounts.cssCount > 0) {
    breakdown.push(color(`${generatedDistAssetCounts.cssCount} CSS`, COLORS.magenta));
  }
  if (packageStats.customExports > 0) {
    breakdown.push(color(`${packageStats.customExports} custom`, COLORS.yellow));
  }

  const totalExportsText = color(`${packageStats.totalExports} exports`, COLORS.brightCyan);
  if (breakdown.length === 0) {
    logger.out(`  ${color("└─", COLORS.dim)} ${totalExportsText}`);
  } else {
    logger.out(`  ${color("└─", COLORS.dim)} ${breakdown.join(" + ")} = ${totalExportsText}`);
  }
  logger.out("");
}

export function logPrunedStaleExport(logger: CliLogger, exportSpecifier: string): void {
  logger.out(
    `  ${color("└─", COLORS.dim)} ${color(`Pruned stale export: ${exportSpecifier}`, COLORS.gray)}`,
  );
}

export function logPackageError(
  logger: CliLogger,
  index: number,
  total: number,
  displayName: string,
  errorValue: unknown,
  verbose: boolean,
): void {
  logger.out(
    `${color(`[${index}/${total}]`, COLORS.dim)} ${color("✗", COLORS.yellow)} ${color(displayName, COLORS.bold)}`,
  );
  logger.out(
    `  ${color("└─", COLORS.dim)} ${color(`Error: ${messageFromCaughtUnknown(errorValue)}`, COLORS.yellow)}\n`,
  );
  if (verbose) {
    logger.err(
      errorValue instanceof Error && errorValue.stack
        ? errorValue.stack
        : messageFromCaughtUnknown(errorValue),
    );
  }
}

export function mirrorSummarySeparator(logger: CliLogger): void {
  logger.out(color("═".repeat(60), COLORS.dim));
}

export function mirrorSummary(logger: CliLogger, stats: GlobalStats, elapsedSeconds: number): void {
  logger.out(
    `${color("📊 Summary", COLORS.bold)} ${color(`(completed in ${elapsedSeconds.toFixed(2)}s)`, COLORS.dim)}\n`,
  );
  logger.out(`  ${color("Packages:", COLORS.bold)}`);
  logger.out(
    `  ${color("├─", COLORS.dim)} Processed: ${color(String(stats.packagesProcessed), COLORS.green)}`,
  );
  if (stats.packagesSkipped > 0) {
    logger.out(
      `  ${color("├─", COLORS.dim)} Skipped: ${color(String(stats.packagesSkipped), COLORS.gray)}`,
    );
  }
  if (stats.packagesErrored > 0) {
    logger.out(
      `  ${color("├─", COLORS.dim)} Errors: ${color(String(stats.packagesErrored), COLORS.yellow)}`,
    );
  }
  logger.out(`  ${color("└─", COLORS.dim)} Total found: ${stats.packagesFound}\n`);

  logger.out(`  ${color("Exports:", COLORS.bold)}`);
  logger.out(
    `  ${color("├─", COLORS.dim)} JS Modules: ${color(String(stats.totalJsModules), COLORS.cyan)}`,
  );
  logger.out(
    `  ${color("├─", COLORS.dim)} CSS Files: ${color(String(stats.totalCssExports), COLORS.magenta)}`,
  );
  logger.out(
    `  ${color("└─", COLORS.dim)} Total: ${color(String(stats.totalExports), COLORS.brightCyan)}\n`,
  );
  logger.out(`${color("═".repeat(60), COLORS.dim)}\n`);
}
