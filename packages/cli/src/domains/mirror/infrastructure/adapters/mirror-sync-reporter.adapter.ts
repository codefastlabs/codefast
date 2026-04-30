import { inject, injectable } from "@codefast/di";
import type { CliRuntime } from "#/shell/application/ports/runtime.port";
import { CliRuntimeToken } from "#/shell/application/cli-runtime.tokens";
import type { MirrorSyncReporterPort } from "#/domains/mirror/application/ports/mirror-sync-reporter.port";
import * as mirrorReporter from "#/domains/mirror/presentation/presenters/mirror-console-reporter.presenter";

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
