/**
 * Infrastructure Module
 *
 * InversifyJS module for binding infrastructure layer dependencies.
 * Following explicit architecture guidelines for CLI applications.
 */

import { ContainerModule } from "inversify";

import type { ComponentAnalysisPort } from "@/core/application/ports/analysis/component.analysis.port";
import type { TypeScriptAnalysisPort } from "@/core/application/ports/analysis/typescript.analysis.port";
import type { LoggingServicePort } from "@/core/application/ports/services/logging.service.port";
import type { FileSystemSystemPort } from "@/core/application/ports/system/file-system.system.port";
import type { PathSystemPort } from "@/core/application/ports/system/path.system.port";
import type { UrlSystemPort } from "@/core/application/ports/system/url.system.port";

import { TYPES } from "@/di/types";
import { ReactComponentAnalysisAdapter } from "@/infrastructure/adapters/analysis/react.component.analysis.adapter";
import { TsMorphTypescriptAnalysisAdapter } from "@/infrastructure/adapters/analysis/ts-morph.typescript.analysis.adapter";
import { ChalkLoggingServiceAdapter } from "@/infrastructure/adapters/services/chalk.logging.service.adapter";
import { FastGlobFileSystemSystemAdapter } from "@/infrastructure/adapters/system/fast-glob.file-system.system.adapter";
import { NodePathSystemAdapter } from "@/infrastructure/adapters/system/node.path.system.adapter";
import { NodeUrlSystemAdapter } from "@/infrastructure/adapters/system/node.url.system.adapter";

export const infrastructureModule = new ContainerModule((options) => {
  // Ports
  options
    .bind<LoggingServicePort>(TYPES.LoggingServicePort)
    .to(ChalkLoggingServiceAdapter)
    .inSingletonScope();
  options
    .bind<FileSystemSystemPort>(TYPES.FilesystemSystemPort)
    .to(FastGlobFileSystemSystemAdapter)
    .inSingletonScope();
  options.bind<PathSystemPort>(TYPES.PathSystemPort).to(NodePathSystemAdapter).inSingletonScope();
  options.bind<UrlSystemPort>(TYPES.UrlSystemPort).to(NodeUrlSystemAdapter).inSingletonScope();
  options
    .bind<TypeScriptAnalysisPort>(TYPES.TypeScriptAnalysisPort)
    .to(TsMorphTypescriptAnalysisAdapter)
    .inTransientScope();
  options
    .bind<ComponentAnalysisPort>(TYPES.ComponentAnalysisPort)
    .to(ReactComponentAnalysisAdapter)
    .inSingletonScope();
});
