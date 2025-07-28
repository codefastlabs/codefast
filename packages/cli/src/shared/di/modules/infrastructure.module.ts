/**
 * Infrastructure Module
 *
 * InversifyJS module for binding infrastructure layer dependencies.
 * Following explicit architecture guidelines for CLI applications.
 */

import { ContainerModule } from "inversify";

import type { ComponentAnalysisPort } from "@/application/ports/secondary/analysis/component.analysis.port";
import type { TreeShakingAnalysisPort } from "@/application/ports/secondary/analysis/tree-shaking.analysis.port";
import type { TypeScriptAnalysisPort } from "@/application/ports/secondary/analysis/typescript.analysis.port";
import type { FileFinderServicePort } from "@/application/ports/secondary/services/file-finder.service.port";
import type { LoggingServicePort } from "@/application/ports/secondary/services/logging.service.port";
import type { FileSystemSystemPort } from "@/application/ports/secondary/system/file-system.system.port";

import { ReactComponentAnalysisAdapter } from "@/infrastructure/adapters/analysis/react.component.analysis.adapter";
import { TsMorphTreeShakingAnalysisAdapter } from "@/infrastructure/adapters/analysis/ts-morph.tree-shaking.analysis.adapter";
import { TsMorphTypescriptAnalysisAdapter } from "@/infrastructure/adapters/analysis/ts-morph.typescript.analysis.adapter";
import { ChalkLoggingServiceAdapter } from "@/infrastructure/adapters/services/chalk.logging.service.adapter";
import { FastGlobFileFinderAdapter } from "@/infrastructure/adapters/services/fast-glob.file-finder.adapter";
import { FastGlobFileSystemSystemAdapter } from "@/infrastructure/adapters/system/fast-glob.file-system.system.adapter";
import { DI_TYPES } from "@/shared/di/types";

export const infrastructureModule = new ContainerModule((options) => {
  // Ports
  options.bind<LoggingServicePort>(DI_TYPES.LoggingServicePort).to(ChalkLoggingServiceAdapter);
  options
    .bind<FileSystemSystemPort>(DI_TYPES.FilesystemSystemPort)
    .to(FastGlobFileSystemSystemAdapter);
  options
    .bind<TypeScriptAnalysisPort>(DI_TYPES.TypeScriptAnalysisPort)
    .to(TsMorphTypescriptAnalysisAdapter)
    .inTransientScope();
  options
    .bind<ComponentAnalysisPort>(DI_TYPES.ComponentAnalysisPort)
    .to(ReactComponentAnalysisAdapter);
  options.bind<FileFinderServicePort>(DI_TYPES.FileFinderServicePort).to(FastGlobFileFinderAdapter);
  options
    .bind<TreeShakingAnalysisPort>(DI_TYPES.TreeShakingAnalysisPort)
    .to(TsMorphTreeShakingAnalysisAdapter)
    .inTransientScope();
});
