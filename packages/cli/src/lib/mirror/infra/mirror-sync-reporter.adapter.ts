import { injectable } from "@codefast/di";
import type { MirrorSyncReporterPort } from "#/lib/mirror/application/ports/mirror-sync-reporter.port";
import * as mirrorReporter from "#/lib/mirror/presentation/reporter.presenter";

@injectable([])
export class MirrorSyncReporterAdapter implements MirrorSyncReporterPort {
  configureMirrorColors = mirrorReporter.configureMirrorColors;
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
