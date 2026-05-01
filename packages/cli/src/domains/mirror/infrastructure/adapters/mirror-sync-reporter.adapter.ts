import { inject, injectable } from "@codefast/di";
import type { CliLogger } from "#/shell/application/ports/cli-io.port";
import type { CliRuntime } from "#/shell/application/ports/runtime.port";
import { CliRuntimeToken } from "#/shell/application/cli-runtime.tokens";
import type {
  MirrorProcessingModeInput,
  MirrorSyncReporterPort,
} from "#/domains/mirror/application/ports/mirror-sync-reporter.port";
import type {
  GlobalStats,
  MirrorDistAssetCounts,
  PackageStats,
} from "#/domains/mirror/domain/types.domain";
import { messageFromCaughtUnknown } from "#/shell/domain/caught-unknown-message.value-object";

const ANSI = {
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
} as const;

/**
 * Console implementation of {@link MirrorSyncReporterPort}: ANSI styling and layout only.
 * One secondary adapter — no separate presentation module to keep the hex boundary explicit.
 */
@injectable([inject(CliRuntimeToken)])
export class MirrorSyncReporterAdapter implements MirrorSyncReporterPort {
  private colorsAreEnabled = true;

  constructor(private readonly runtime: CliRuntime) {}

  configureMirrorColors(noColor: boolean): void {
    this.colorsAreEnabled = this.runtime.isStdoutTty() && !noColor;
  }

  mirrorBanner(logger: CliLogger): void {
    logger.out(`\n${this.paint("📦 Mirror — package exports", ANSI.bold + ANSI.cyan)}`);
    logger.out(`${this.paint("═".repeat(60), ANSI.dim)}\n`);
  }

  mirrorProcessingMode(logger: CliLogger, mode: MirrorProcessingModeInput): void {
    if (mode.kind === "single") {
      logger.out(`${this.paint("Processing single package...", ANSI.dim)}\n`);
      return;
    }
    if (mode.source === "default-patterns") {
      logger.out(
        `${this.paint(
          "Discovering workspace packages using default patterns (packages/*)…",
          ANSI.dim,
        )}\n`,
      );
      return;
    }
    if (mode.source === "pnpm-workspace-yaml") {
      logger.out(
        `${this.paint("Discovering workspace packages from pnpm-workspace.yaml…", ANSI.dim)}\n`,
      );
      return;
    }
    logger.out(
      `${this.paint("pnpm-workspace.yaml declares an empty workspace package list.", ANSI.dim)}\n`,
    );
  }

  mirrorNoPackages(logger: CliLogger): void {
    logger.out(this.paint("⚠ No packages found", ANSI.yellow));
  }

  logSkippedWorkspacePackage(
    logger: CliLogger,
    index: number,
    total: number,
    displayName: string,
    reason: string,
  ): void {
    const progress = this.paint(`[${index}/${total}]`, ANSI.dim);
    logger.out(`${progress} ${this.paint("○", ANSI.gray)} ${this.paint(displayName, ANSI.dim)}`);
    logger.out(`  ${this.paint("└─", ANSI.dim)} ${this.paint(`Skipped: ${reason}`, ANSI.gray)}`);
    logger.out("");
  }

  logPackageSuccess(
    logger: CliLogger,
    index: number,
    total: number,
    pkgStats: PackageStats,
    generatedDistAssetCounts: MirrorDistAssetCounts,
    verbose: boolean,
  ): void {
    const progress = this.paint(`[${index}/${total}]`, ANSI.dim);
    logger.out(
      `${progress} ${this.paint("✓", ANSI.brightGreen)} ${this.paint(pkgStats.name, ANSI.bold)}`,
    );

    if (verbose) {
      logger.out(`  ${this.paint("├─", ANSI.dim)} Path: ${pkgStats.path}`);
      if (pkgStats.hasTransform) {
        logger.out(
          `  ${this.paint("├─", ANSI.dim)} ${this.paint("Custom path transformation", ANSI.cyan)}`,
        );
      }
      if (pkgStats.cssConfigStatus) {
        const status = pkgStats.cssConfigStatus === "disabled" ? "CSS disabled" : "CSS configured";
        logger.out(`  ${this.paint("├─", ANSI.dim)} ${this.paint(status, ANSI.cyan)}`);
      }
    }

    const breakdown: string[] = [];
    if (generatedDistAssetCounts.jsCount > 0) {
      breakdown.push(this.paint(`${generatedDistAssetCounts.jsCount} modules`, ANSI.green));
    }
    if (generatedDistAssetCounts.cssCount > 0) {
      breakdown.push(this.paint(`${generatedDistAssetCounts.cssCount} CSS`, ANSI.magenta));
    }
    if (pkgStats.customExports > 0) {
      breakdown.push(this.paint(`${pkgStats.customExports} custom`, ANSI.yellow));
    }

    const totalExportsText = this.paint(`${pkgStats.totalExports} exports`, ANSI.brightCyan);
    if (breakdown.length === 0) {
      logger.out(`  ${this.paint("└─", ANSI.dim)} ${totalExportsText}`);
    } else {
      logger.out(`  ${this.paint("└─", ANSI.dim)} ${breakdown.join(" + ")} = ${totalExportsText}`);
    }
    logger.out("");
  }

  logPrunedStaleExport(logger: CliLogger, exportSpecifier: string): void {
    logger.out(
      `  ${this.paint("└─", ANSI.dim)} ${this.paint(`Pruned stale export: ${exportSpecifier}`, ANSI.gray)}`,
    );
  }

  logPackageError(
    logger: CliLogger,
    index: number,
    total: number,
    displayName: string,
    errorValue: unknown,
    verbose: boolean,
  ): void {
    logger.out(
      `${this.paint(`[${index}/${total}]`, ANSI.dim)} ${this.paint("✗", ANSI.yellow)} ${this.paint(displayName, ANSI.bold)}`,
    );
    logger.out(
      `  ${this.paint("└─", ANSI.dim)} ${this.paint(`Error: ${messageFromCaughtUnknown(errorValue)}`, ANSI.yellow)}\n`,
    );
    if (verbose) {
      logger.err(
        errorValue instanceof Error && errorValue.stack
          ? errorValue.stack
          : messageFromCaughtUnknown(errorValue),
      );
    }
  }

  mirrorSummarySeparator(logger: CliLogger): void {
    logger.out(this.paint("═".repeat(60), ANSI.dim));
  }

  mirrorSummary(logger: CliLogger, stats: GlobalStats, elapsedSeconds: number): void {
    logger.out(
      `${this.paint("📊 Summary", ANSI.bold)} ${this.paint(`(completed in ${elapsedSeconds.toFixed(2)}s)`, ANSI.dim)}\n`,
    );
    logger.out(`  ${this.paint("Packages:", ANSI.bold)}`);
    logger.out(
      `  ${this.paint("├─", ANSI.dim)} Processed: ${this.paint(String(stats.packagesProcessed), ANSI.green)}`,
    );
    if (stats.packagesSkipped > 0) {
      logger.out(
        `  ${this.paint("├─", ANSI.dim)} Skipped: ${this.paint(String(stats.packagesSkipped), ANSI.gray)}`,
      );
    }
    if (stats.packagesErrored > 0) {
      logger.out(
        `  ${this.paint("├─", ANSI.dim)} Errors: ${this.paint(String(stats.packagesErrored), ANSI.yellow)}`,
      );
    }
    logger.out(`  ${this.paint("└─", ANSI.dim)} Total found: ${stats.packagesFound}\n`);

    logger.out(`  ${this.paint("Exports:", ANSI.bold)}`);
    logger.out(
      `  ${this.paint("├─", ANSI.dim)} JS Modules: ${this.paint(String(stats.totalJsModules), ANSI.cyan)}`,
    );
    logger.out(
      `  ${this.paint("├─", ANSI.dim)} CSS Files: ${this.paint(String(stats.totalCssExports), ANSI.magenta)}`,
    );
    logger.out(
      `  ${this.paint("└─", ANSI.dim)} Total: ${this.paint(String(stats.totalExports), ANSI.brightCyan)}\n`,
    );
    logger.out(`${this.paint("═".repeat(60), ANSI.dim)}\n`);
  }

  private paint(text: string, openSequence: string): string {
    if (!this.colorsAreEnabled) {
      return text;
    }
    return `${openSequence}${text}${ANSI.reset}`;
  }
}
