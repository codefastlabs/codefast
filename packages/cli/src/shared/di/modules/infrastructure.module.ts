/**
 * Infrastructure Module
 *
 * InversifyJS module for binding infrastructure layer dependencies.
 * Following explicit architecture guidelines for CLI applications.
 */

import { ContainerModule } from "inversify";

import type { ComponentAnalysisPort } from "../../../application/ports/analysis/component.analysis.port";
import type { TreeShakingAnalysisPort } from "../../../application/ports/analysis/tree-shaking.analysis.port";
import type { TypeScriptAnalysisPort } from "../../../application/ports/analysis/typescript.analysis.port";
import type { FileFinderServicePort } from "../../../application/ports/services/file-finder.service.port";
import type { LoggingServicePort } from "../../../application/ports/services/logging.service.port";
import type { FileSystemSystemPort } from "../../../application/ports/system/file-system.system.port";

import { ReactComponentAnalysisAdapter } from "../../../infrastructure/adapters/analysis/react.component.analysis.adapter";
import { TsMorphTreeShakingAnalysisAdapter } from "../../../infrastructure/adapters/analysis/ts-morph.tree-shaking.analysis.adapter";
import { TsMorphTypescriptAnalysisAdapter } from "../../../infrastructure/adapters/analysis/ts-morph.typescript.analysis.adapter";
import { ChalkLoggingServiceAdapter } from "../../../infrastructure/adapters/services/chalk.logging.service.adapter";
import { FastGlobFileFinderAdapter } from "../../../infrastructure/adapters/services/fast-glob.file-finder.adapter";
import { FastGlobFileSystemSystemAdapter } from "../../../infrastructure/adapters/system/fast-glob.file-system.system.adapter";
import { TYPES } from "../types";

export const infrastructureModule = new ContainerModule((options) => {
  // Ports
  options.bind<LoggingServicePort>(TYPES.LoggingServicePort).to(ChalkLoggingServiceAdapter);
  options
    .bind<FileSystemSystemPort>(TYPES.FilesystemSystemPort)
    .to(FastGlobFileSystemSystemAdapter);
  options
    .bind<TypeScriptAnalysisPort>(TYPES.TypeScriptAnalysisPort)
    .to(TsMorphTypescriptAnalysisAdapter)
    .inTransientScope();
  options
    .bind<ComponentAnalysisPort>(TYPES.ComponentAnalysisPort)
    .to(ReactComponentAnalysisAdapter);
  options.bind<FileFinderServicePort>(TYPES.FileFinderServicePort).to(FastGlobFileFinderAdapter);
  options
    .bind<TreeShakingAnalysisPort>(TYPES.TreeShakingAnalysisPort)
    .to(TsMorphTreeShakingAnalysisAdapter)
    .inTransientScope();
});
