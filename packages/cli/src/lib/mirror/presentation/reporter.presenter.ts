import { messageFromCaughtUnknown } from "#/lib/core/application/utils/caught-unknown-message.util";
import { printConfigSchemaWarnings } from "#/lib/infra/config-reporter.adapter";
import type { CliLogger } from "#/lib/core/application/ports/cli-io.port";
import type {
  GlobalStats,
  PackageStats,
  WorkspaceMultiDiscoverySource,
} from "#/lib/mirror/domain/types.domain";

const Colors = {
  RESET: "\x1b[0m",
  BOLD: "\x1b[1m",
  DIM: "\x1b[2m",
  GREEN: "\x1b[32m",
  YELLOW: "\x1b[33m",
  CYAN: "\x1b[36m",
  GRAY: "\x1b[90m",
  MAGENTA: "\x1b[35m",
  BRIGHT_GREEN: "\x1b[92m",
  BRIGHT_YELLOW: "\x1b[93m",
  BRIGHT_CYAN: "\x1b[96m",
  disable() {
    for (const key of Object.keys(this)) {
      if (typeof this[key as keyof typeof Colors] === "string") {
        (this as Record<string, unknown>)[key] = "";
      }
    }
  },
};

export function configureMirrorColors(noColor: boolean, isStdoutTty: boolean): void {
  if (!isStdoutTty || noColor) {
    Colors.disable();
  }
}

export function printMirrorConfigWarnings(logger: CliLogger, warnings: string[]): void {
  printConfigSchemaWarnings(logger, warnings);
}

export function mirrorGlobWarning(logger: CliLogger, message: string): void {
  logger.out(`${Colors.YELLOW}⚠ ${message}${Colors.RESET}`);
}

export function logSkippedWorkspacePackage(
  logger: CliLogger,
  index: number,
  total: number,
  displayName: string,
  reason: string,
): void {
  const progress = `${Colors.DIM}[${index}/${total}]${Colors.RESET}`;
  logger.out(
    `${progress} ${Colors.GRAY}○${Colors.RESET} ${Colors.DIM}${displayName}${Colors.RESET}`,
  );
  logger.out(`  ${Colors.DIM}└─${Colors.RESET} ${Colors.GRAY}Skipped: ${reason}${Colors.RESET}`);
  logger.out("");
}

export function mirrorBanner(logger: CliLogger): void {
  logger.out(`\n${Colors.BOLD}${Colors.CYAN}📦 Mirror — package exports${Colors.RESET}`);
  logger.out(`${Colors.DIM}${"═".repeat(60)}${Colors.RESET}\n`);
}

export type MirrorProcessingMode =
  | { kind: "single" }
  | { kind: "multi"; source: WorkspaceMultiDiscoverySource };

export function mirrorProcessingMode(logger: CliLogger, mode: MirrorProcessingMode): void {
  if (mode.kind === "single") {
    logger.out(`${Colors.DIM}Processing single package...${Colors.RESET}\n`);
    return;
  }
  switch (mode.source) {
    case "default-patterns":
      logger.out(
        `${Colors.DIM}Discovering workspace packages using default patterns (packages/*)…${Colors.RESET}\n`,
      );
      break;
    case "pnpm-workspace-yaml":
      logger.out(
        `${Colors.DIM}Discovering workspace packages from pnpm-workspace.yaml…${Colors.RESET}\n`,
      );
      break;
    case "declared-empty":
      logger.out(
        `${Colors.DIM}pnpm-workspace.yaml declares an empty workspace package list.${Colors.RESET}\n`,
      );
      break;
  }
}

export function mirrorNoPackages(logger: CliLogger): void {
  logger.out(`${Colors.YELLOW}⚠ No packages found${Colors.RESET}`);
}

export function logPackageSuccess(
  logger: CliLogger,
  index: number,
  total: number,
  pkgStats: PackageStats,
  generatedDistAssetCounts: { jsCount: number; cssCount: number },
  verbose: boolean,
): void {
  const progress = `${Colors.DIM}[${index}/${total}]${Colors.RESET}`;
  logger.out(
    `${progress} ${Colors.BRIGHT_GREEN}✓${Colors.RESET} ${Colors.BOLD}${pkgStats.name}${Colors.RESET}`,
  );

  if (verbose) {
    logger.out(`  ${Colors.DIM}├─${Colors.RESET} Path: ${pkgStats.path}`);
    if (pkgStats.hasTransform) {
      logger.out(
        `  ${Colors.DIM}├─${Colors.RESET} ${Colors.CYAN}Custom path transformation${Colors.RESET}`,
      );
    }
    if (pkgStats.cssConfigStatus) {
      logger.out(
        `  ${Colors.DIM}├─${Colors.RESET} ${Colors.CYAN}${pkgStats.cssConfigStatus === "disabled" ? "CSS disabled" : "CSS configured"}${Colors.RESET}`,
      );
    }
  }

  const breakdown: string[] = [];
  if (generatedDistAssetCounts.jsCount > 0) {
    breakdown.push(`${Colors.GREEN}${generatedDistAssetCounts.jsCount} modules${Colors.RESET}`);
  }
  if (generatedDistAssetCounts.cssCount > 0) {
    breakdown.push(`${Colors.MAGENTA}${generatedDistAssetCounts.cssCount} CSS${Colors.RESET}`);
  }
  if (pkgStats.customExports > 0) {
    breakdown.push(`${Colors.YELLOW}${pkgStats.customExports} custom${Colors.RESET}`);
  }

  if (breakdown.length > 0) {
    logger.out(
      `  ${Colors.DIM}└─${Colors.RESET} ${breakdown.join(" + ")} = ${Colors.BRIGHT_CYAN}${pkgStats.totalExports} exports${Colors.RESET}`,
    );
  } else {
    logger.out(
      `  ${Colors.DIM}└─${Colors.RESET} ${Colors.BRIGHT_CYAN}${pkgStats.totalExports} exports${Colors.RESET}`,
    );
  }
  logger.out("");
}

export function logPrunedStaleExport(logger: CliLogger, exportSpecifier: string): void {
  logger.out(
    `  ${Colors.DIM}└─${Colors.RESET} ${Colors.GRAY}Pruned stale export: ${exportSpecifier}${Colors.RESET}`,
  );
}

export function logPackageError(
  logger: CliLogger,
  index: number,
  total: number,
  displayName: string,
  errValue: unknown,
  verbose: boolean,
): void {
  logger.out(
    `${Colors.DIM}[${index}/${total}]${Colors.RESET} ${Colors.YELLOW}✗${Colors.RESET} ${Colors.BOLD}${displayName}${Colors.RESET}`,
  );
  logger.out(
    `  ${Colors.DIM}└─${Colors.RESET} ${Colors.YELLOW}Error: ${messageFromCaughtUnknown(errValue)}${Colors.RESET}\n`,
  );
  if (verbose) {
    logger.err(
      errValue instanceof Error && errValue.stack
        ? errValue.stack
        : messageFromCaughtUnknown(errValue),
    );
  }
}

export function mirrorSummarySeparator(logger: CliLogger): void {
  logger.out(`${Colors.DIM}${"═".repeat(60)}${Colors.RESET}`);
}

export function mirrorSummary(logger: CliLogger, stats: GlobalStats, elapsedSeconds: number): void {
  logger.out(
    `${Colors.BOLD}📊 Summary${Colors.RESET} ${Colors.DIM}(completed in ${elapsedSeconds.toFixed(2)}s)${Colors.RESET}\n`,
  );

  logger.out(`  ${Colors.BOLD}Packages:${Colors.RESET}`);
  logger.out(
    `  ${Colors.DIM}├─${Colors.RESET} Processed: ${Colors.GREEN}${stats.packagesProcessed}${Colors.RESET}`,
  );
  if (stats.packagesSkipped > 0) {
    logger.out(
      `  ${Colors.DIM}├─${Colors.RESET} Skipped: ${Colors.GRAY}${stats.packagesSkipped}${Colors.RESET}`,
    );
  }
  if (stats.packagesErrored > 0) {
    logger.out(
      `  ${Colors.DIM}├─${Colors.RESET} Errors: ${Colors.YELLOW}${stats.packagesErrored}${Colors.RESET}`,
    );
  }
  logger.out(`  ${Colors.DIM}└─${Colors.RESET} Total found: ${stats.packagesFound}\n`);

  logger.out(`  ${Colors.BOLD}Exports:${Colors.RESET}`);
  logger.out(
    `  ${Colors.DIM}├─${Colors.RESET} JS Modules: ${Colors.CYAN}${stats.totalJsModules}${Colors.RESET}`,
  );
  logger.out(
    `  ${Colors.DIM}├─${Colors.RESET} CSS Files: ${Colors.MAGENTA}${stats.totalCssExports}${Colors.RESET}`,
  );
  logger.out(
    `  ${Colors.DIM}└─${Colors.RESET} Total: ${Colors.BRIGHT_CYAN}${stats.totalExports}${Colors.RESET}\n`,
  );

  logger.out(`${Colors.DIM}${"═".repeat(60)}${Colors.RESET}\n`);
}

export function mirrorFatalError(logger: CliLogger, caughtError: unknown): void {
  logger.out(
    `${Colors.YELLOW}Fatal error: ${messageFromCaughtUnknown(caughtError)}${Colors.RESET}`,
  );
  logger.err(
    caughtError instanceof Error && caughtError.stack
      ? caughtError.stack
      : messageFromCaughtUnknown(caughtError),
  );
}
