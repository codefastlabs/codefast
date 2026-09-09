import process from "node:process";

import { messageFrom } from "#/core/errors";
import { logger } from "#/core/logger";
import type {
  CliLoggerLike,
  GlobalStats,
  MirrorDistAssetCounts,
  MirrorProcessingModeInput,
  MirrorSyncProgressListener,
  PackageStats,
} from "#/mirror/domain/types";

const cliLogger: CliLoggerLike = logger;

/**
 * A progress listener that renders mirror run events through the CLI reporter.
 *
 * @since 0.3.16-canary.0
 */
export class MirrorSyncProgressPresenter implements MirrorSyncProgressListener {
  private readonly reporter = new MirrorSyncReporter();
  private verbose = false;
  private dryRun = false;

  configure(options: { readonly noColor: boolean; readonly verbose: boolean; readonly dryRun: boolean }): void {
    this.verbose = options.verbose;
    this.dryRun = options.dryRun;
    this.reporter.configureMirrorColors(options.noColor);
  }

  onBanner(): void {
    this.reporter.mirrorBanner(cliLogger);
    if (this.dryRun) {
      this.reporter.mirrorDryRunNotice(cliLogger);
    }
  }

  onProcessingMode(mode: MirrorProcessingModeInput): void {
    this.reporter.mirrorProcessingMode(cliLogger, mode);
  }

  onNoPackages(): void {
    this.reporter.mirrorNoPackages(cliLogger);
  }

  onPackageComplete(pkgStats: PackageStats, ordinal: number, total: number): void {
    if (pkgStats.skipped) {
      this.reporter.logSkippedWorkspacePackage(cliLogger, ordinal, total, pkgStats.name, pkgStats.skipReason);
      return;
    }
    if (pkgStats.error !== null) {
      this.reporter.logPackageError(cliLogger, ordinal, total, pkgStats.name, pkgStats.error, this.verbose);
      return;
    }
    for (const exportSpecifier of pkgStats.prunedExportKeys) {
      this.reporter.logPrunedStaleExport(cliLogger, exportSpecifier);
    }
    this.reporter.logPackageSuccess(
      cliLogger,
      ordinal,
      total,
      pkgStats,
      { jsCount: pkgStats.jsModules, cssCount: pkgStats.cssExports },
      this.verbose,
    );
  }

  onComplete(stats: GlobalStats, elapsedSeconds: number): void {
    this.reporter.mirrorSummarySeparator(cliLogger);
    this.reporter.mirrorSummary(cliLogger, stats, elapsedSeconds);
  }
}

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
 * Console rendering — ANSI styling and layout — for every line a mirror run prints.
 */
class MirrorSyncReporter {
  private colorsAreEnabled = true;

  configureMirrorColors(noColor: boolean): void {
    this.colorsAreEnabled = !!process.stdout.isTTY && !noColor;
  }

  mirrorBanner(target: CliLoggerLike): void {
    target.out(`\n${this.paint("📦 Mirror — package exports", ANSI.bold + ANSI.cyan)}`);
    target.out(`${this.paint("═".repeat(60), ANSI.dim)}\n`);
  }

  mirrorDryRunNotice(target: CliLoggerLike): void {
    target.out(`${this.paint("Dry run — no files will be written.", ANSI.yellow)}\n`);
  }

  mirrorProcessingMode(target: CliLoggerLike, mode: MirrorProcessingModeInput): void {
    if (mode.kind === "single") {
      target.out(`${this.paint("Processing single package...", ANSI.dim)}\n`);
      return;
    }
    if (mode.source === "default-patterns") {
      target.out(`${this.paint("Discovering workspace packages using default patterns (packages/*)…", ANSI.dim)}\n`);
      return;
    }
    if (mode.source === "pnpm-workspace-yaml") {
      target.out(`${this.paint("Discovering workspace packages from pnpm-workspace.yaml…", ANSI.dim)}\n`);
      return;
    }
    if (mode.source === "single-package") {
      target.out(
        `${this.paint("No pnpm-workspace.yaml — processing the single package at the project root…", ANSI.dim)}\n`,
      );
      return;
    }
    target.out(`${this.paint("pnpm-workspace.yaml declares an empty workspace package list.", ANSI.dim)}\n`);
  }

  mirrorNoPackages(target: CliLoggerLike): void {
    target.out(this.paint("⚠ No packages found", ANSI.yellow));
  }

  logSkippedWorkspacePackage(
    target: CliLoggerLike,
    index: number,
    total: number,
    displayName: string,
    reason: string,
  ): void {
    const progress = this.paint(`[${index}/${total}]`, ANSI.dim);
    target.out(`${progress} ${this.paint("○", ANSI.gray)} ${this.paint(displayName, ANSI.dim)}`);
    target.out(`  ${this.paint("└─", ANSI.dim)} ${this.paint(`Skipped: ${reason}`, ANSI.gray)}`);
    target.out("");
  }

  logPackageSuccess(
    target: CliLoggerLike,
    index: number,
    total: number,
    pkgStats: PackageStats,
    generatedDistAssetCounts: MirrorDistAssetCounts,
    verbose: boolean,
  ): void {
    const progress = this.paint(`[${index}/${total}]`, ANSI.dim);
    target.out(`${progress} ${this.paint("✓", ANSI.brightGreen)} ${this.paint(pkgStats.name, ANSI.bold)}`);

    if (verbose) {
      target.out(`  ${this.paint("├─", ANSI.dim)} Path: ${pkgStats.path}`);
      if (pkgStats.hasTransform) {
        target.out(`  ${this.paint("├─", ANSI.dim)} ${this.paint("Custom path transformation", ANSI.cyan)}`);
      }
      if (pkgStats.cssConfigStatus) {
        const status = pkgStats.cssConfigStatus === "disabled" ? "CSS disabled" : "CSS configured";
        target.out(`  ${this.paint("├─", ANSI.dim)} ${this.paint(status, ANSI.cyan)}`);
      }
    }

    const breakdown: Array<string> = [];
    if (generatedDistAssetCounts.jsCount > 0) {
      breakdown.push(this.paint(`${generatedDistAssetCounts.jsCount} modules`, ANSI.green));
    }
    if (generatedDistAssetCounts.cssCount > 0) {
      breakdown.push(this.paint(`${generatedDistAssetCounts.cssCount} CSS`, ANSI.magenta));
    }
    if (pkgStats.extraExports > 0) {
      breakdown.push(this.paint(`${pkgStats.extraExports} custom`, ANSI.yellow));
    }

    const totalExportsText = this.paint(`${pkgStats.totalExports} exports`, ANSI.brightCyan);
    if (breakdown.length === 0) {
      target.out(`  ${this.paint("└─", ANSI.dim)} ${totalExportsText}`);
    } else {
      target.out(`  ${this.paint("└─", ANSI.dim)} ${breakdown.join(" + ")} = ${totalExportsText}`);
    }
    target.out("");
  }

  logPrunedStaleExport(target: CliLoggerLike, exportSpecifier: string): void {
    target.out(`  ${this.paint("└─", ANSI.dim)} ${this.paint(`Pruned stale export: ${exportSpecifier}`, ANSI.gray)}`);
  }

  logPackageError(
    target: CliLoggerLike,
    index: number,
    total: number,
    displayName: string,
    errorValue: unknown,
    verbose: boolean,
  ): void {
    target.out(
      `${this.paint(`[${index}/${total}]`, ANSI.dim)} ${this.paint("✗", ANSI.yellow)} ${this.paint(displayName, ANSI.bold)}`,
    );
    target.out(`  ${this.paint("└─", ANSI.dim)} ${this.paint(`Error: ${messageFrom(errorValue)}`, ANSI.yellow)}\n`);
    if (verbose) {
      target.err(errorValue instanceof Error && errorValue.stack ? errorValue.stack : messageFrom(errorValue));
    }
  }

  mirrorSummarySeparator(target: CliLoggerLike): void {
    target.out(this.paint("═".repeat(60), ANSI.dim));
  }

  mirrorSummary(target: CliLoggerLike, stats: GlobalStats, elapsedSeconds: number): void {
    target.out(
      `${this.paint("📊 Summary", ANSI.bold)} ${this.paint(`(completed in ${elapsedSeconds.toFixed(2)}s)`, ANSI.dim)}\n`,
    );
    target.out(`  ${this.paint("Packages:", ANSI.bold)}`);
    target.out(`  ${this.paint("├─", ANSI.dim)} Processed: ${this.paint(String(stats.packagesProcessed), ANSI.green)}`);
    if (stats.packagesSkipped > 0) {
      target.out(`  ${this.paint("├─", ANSI.dim)} Skipped: ${this.paint(String(stats.packagesSkipped), ANSI.gray)}`);
    }
    if (stats.packagesErrored > 0) {
      target.out(`  ${this.paint("├─", ANSI.dim)} Errors: ${this.paint(String(stats.packagesErrored), ANSI.yellow)}`);
    }
    target.out(`  ${this.paint("└─", ANSI.dim)} Total found: ${stats.packagesFound}\n`);

    target.out(`  ${this.paint("Exports:", ANSI.bold)}`);
    target.out(`  ${this.paint("├─", ANSI.dim)} JS Modules: ${this.paint(String(stats.totalJsModules), ANSI.cyan)}`);
    target.out(`  ${this.paint("├─", ANSI.dim)} CSS Files: ${this.paint(String(stats.totalCssExports), ANSI.magenta)}`);
    target.out(`  ${this.paint("└─", ANSI.dim)} Total: ${this.paint(String(stats.totalExports), ANSI.brightCyan)}\n`);
    target.out(`${this.paint("═".repeat(60), ANSI.dim)}\n`);
  }

  private paint(text: string, openSequence: string): string {
    if (!this.colorsAreEnabled) {
      return text;
    }
    return `${openSequence}${text}${ANSI.reset}`;
  }
}
