import { messageFrom } from "#core/errors";
import { logger } from "#core/logger";
import type { TextStyle } from "#core/style";
import { paint } from "#core/style";
import type {
  CliLoggerLike,
  GlobalStats,
  MirrorDistAssetCounts,
  MirrorProcessingModeInput,
  MirrorSyncProgressListener,
  PackageStats,
} from "#exports/domain/types";

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

  configure(options: { readonly verbose: boolean; readonly dryRun: boolean }): void {
    this.verbose = options.verbose;
    this.dryRun = options.dryRun;
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

/**
 * Console rendering — styling and layout — for every line a mirror run prints.
 */
class MirrorSyncReporter {
  mirrorBanner(target: CliLoggerLike): void {
    target.out(`\n${this.paint("📦 Mirror — package exports", ["bold", "cyan"])}`);
    target.out(`${this.paint("═".repeat(60), "dim")}\n`);
  }

  mirrorDryRunNotice(target: CliLoggerLike): void {
    target.out(`${this.paint("Dry run — no files will be written.", "yellow")}\n`);
  }

  mirrorProcessingMode(target: CliLoggerLike, mode: MirrorProcessingModeInput): void {
    if (mode.kind === "single") {
      target.out(`${this.paint("Processing single package...", "dim")}\n`);
      return;
    }
    if (mode.source === "default-patterns") {
      target.out(`${this.paint("Discovering workspace packages using default patterns (packages/*)…", "dim")}\n`);
      return;
    }
    if (mode.source === "pnpm-workspace-yaml") {
      target.out(`${this.paint("Discovering workspace packages from pnpm-workspace.yaml…", "dim")}\n`);
      return;
    }
    if (mode.source === "single-package") {
      target.out(
        `${this.paint("No pnpm-workspace.yaml — processing the single package at the project root…", "dim")}\n`,
      );
      return;
    }
    target.out(`${this.paint("pnpm-workspace.yaml declares an empty workspace package list.", "dim")}\n`);
  }

  mirrorNoPackages(target: CliLoggerLike): void {
    target.out(this.paint("⚠ No packages found", "yellow"));
  }

  logSkippedWorkspacePackage(
    target: CliLoggerLike,
    index: number,
    total: number,
    displayName: string,
    reason: string,
  ): void {
    const progress = this.paint(`[${index}/${total}]`, "dim");
    target.out(`${progress} ${this.paint("○", "gray")} ${this.paint(displayName, "dim")}`);
    target.out(`  ${this.paint("└─", "dim")} ${this.paint(`Skipped: ${reason}`, "gray")}`);
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
    const progress = this.paint(`[${index}/${total}]`, "dim");
    target.out(`${progress} ${this.paint("✓", "greenBright")} ${this.paint(pkgStats.name, "bold")}`);

    if (verbose) {
      target.out(`  ${this.paint("├─", "dim")} Path: ${pkgStats.path}`);
      if (pkgStats.hasTransform) {
        target.out(`  ${this.paint("├─", "dim")} ${this.paint("Custom path transformation", "cyan")}`);
      }
      if (pkgStats.cssConfigStatus) {
        const status = pkgStats.cssConfigStatus === "disabled" ? "CSS disabled" : "CSS configured";
        target.out(`  ${this.paint("├─", "dim")} ${this.paint(status, "cyan")}`);
      }
    }

    const breakdown: Array<string> = [];
    if (generatedDistAssetCounts.jsCount > 0) {
      breakdown.push(this.paint(`${generatedDistAssetCounts.jsCount} modules`, "green"));
    }
    if (generatedDistAssetCounts.cssCount > 0) {
      breakdown.push(this.paint(`${generatedDistAssetCounts.cssCount} CSS`, "magenta"));
    }
    if (pkgStats.extraExports > 0) {
      breakdown.push(this.paint(`${pkgStats.extraExports} custom`, "yellow"));
    }

    const totalExportsText = this.paint(`${pkgStats.totalExports} exports`, "cyanBright");
    if (breakdown.length === 0) {
      target.out(`  ${this.paint("└─", "dim")} ${totalExportsText}`);
    } else {
      target.out(`  ${this.paint("└─", "dim")} ${breakdown.join(" + ")} = ${totalExportsText}`);
    }
    target.out("");
  }

  logPrunedStaleExport(target: CliLoggerLike, exportSpecifier: string): void {
    target.out(`  ${this.paint("└─", "dim")} ${this.paint(`Pruned stale export: ${exportSpecifier}`, "gray")}`);
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
      `${this.paint(`[${index}/${total}]`, "dim")} ${this.paint("✗", "yellow")} ${this.paint(displayName, "bold")}`,
    );
    target.out(`  ${this.paint("└─", "dim")} ${this.paint(`Error: ${messageFrom(errorValue)}`, "yellow")}\n`);
    if (verbose) {
      target.err(errorValue instanceof Error && errorValue.stack ? errorValue.stack : messageFrom(errorValue));
    }
  }

  mirrorSummarySeparator(target: CliLoggerLike): void {
    target.out(this.paint("═".repeat(60), "dim"));
  }

  mirrorSummary(target: CliLoggerLike, stats: GlobalStats, elapsedSeconds: number): void {
    target.out(
      `${this.paint("📊 Summary", "bold")} ${this.paint(`(completed in ${elapsedSeconds.toFixed(2)}s)`, "dim")}\n`,
    );
    target.out(`  ${this.paint("Packages:", "bold")}`);
    target.out(`  ${this.paint("├─", "dim")} Processed: ${this.paint(String(stats.packagesProcessed), "green")}`);
    if (stats.packagesSkipped > 0) {
      target.out(`  ${this.paint("├─", "dim")} Skipped: ${this.paint(String(stats.packagesSkipped), "gray")}`);
    }
    if (stats.packagesErrored > 0) {
      target.out(`  ${this.paint("├─", "dim")} Errors: ${this.paint(String(stats.packagesErrored), "yellow")}`);
    }
    target.out(`  ${this.paint("└─", "dim")} Total found: ${stats.packagesFound}\n`);

    target.out(`  ${this.paint("Exports:", "bold")}`);
    target.out(`  ${this.paint("├─", "dim")} JS Modules: ${this.paint(String(stats.totalJsModules), "cyan")}`);
    target.out(`  ${this.paint("├─", "dim")} CSS Files: ${this.paint(String(stats.totalCssExports), "magenta")}`);
    target.out(`  ${this.paint("└─", "dim")} Total: ${this.paint(String(stats.totalExports), "cyanBright")}\n`);
    target.out(`${this.paint("═".repeat(60), "dim")}\n`);
  }

  private paint(text: string, style: TextStyle): string {
    return paint(style, text);
  }
}
