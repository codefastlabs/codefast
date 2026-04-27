import { inject, injectable } from "@codefast/di";
import type { CliRuntime } from "#/lib/core/application/ports/runtime.port";
import { CliRuntimeToken } from "#/lib/core/contracts/tokens";
import type { MirrorSyncReporterPort } from "#/lib/mirror/application/ports/mirror-sync-reporter.port";
import * as mirrorReporter from "#/lib/mirror/presentation/reporter.presenter";

@injectable([inject(CliRuntimeToken)])
export class MirrorSyncReporterAdapter implements MirrorSyncReporterPort {
  constructor(private readonly runtime: CliRuntime) {}

  configureMirrorColors(noColor: boolean): void {
    mirrorReporter.configureMirrorColors(noColor, this.runtime.isStdoutTty());
  }

  mirrorBanner = mirrorReporter.mirrorBanner;
  mirrorProcessingMode = mirrorReporter.mirrorProcessingMode;
  mirrorNoPackages = mirrorReporter.mirrorNoPackages;
  logWorkspaceGlobWarning = mirrorReporter.mirrorGlobWarning;
  logSkippedWorkspacePackage = mirrorReporter.logSkippedWorkspacePackage;
  logPackageSuccess = mirrorReporter.logPackageSuccess;
  logPrunedStaleExport = mirrorReporter.logPrunedStaleExport;
  logPackageError = mirrorReporter.logPackageError;
  mirrorSummarySeparator = mirrorReporter.mirrorSummarySeparator;
  mirrorSummary = mirrorReporter.mirrorSummary;
}
