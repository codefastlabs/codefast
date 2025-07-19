/**
 * Infrastructure Module
 *
 * InversifyJS module for binding infrastructure layer dependencies.
 * Following explicit architecture guidelines for CLI applications.
 */

import { ContainerModule } from "inversify";

import type { FileSystemService } from "@/core/application/ports/file-system.port";
import type { LoggingService } from "@/core/application/ports/logging.port";
import type { TypeScriptAnalysisService } from "@/core/application/ports/typescript-analysis.port";

import { TYPES } from "@/di/types";
import { FastGlobFileSystemAdapter } from "@/infrastructure/adapters/file-system.adapter";
import { ChalkLoggingAdapter } from "@/infrastructure/adapters/logging.adapter";
import { TsMorphAnalysisAdapter } from "@/infrastructure/adapters/typescript-analysis.adapter";

export const infrastructureModule = new ContainerModule(({ bind }) => {
  // Logging Service
  bind<LoggingService>(TYPES.LoggingService).to(ChalkLoggingAdapter).inSingletonScope();

  // File System Service
  bind<FileSystemService>(TYPES.FileSystemService).to(FastGlobFileSystemAdapter).inSingletonScope();

  // TypeScript Analysis Service
  bind<TypeScriptAnalysisService>(TYPES.TypeScriptAnalysisService)
    .to(TsMorphAnalysisAdapter)
    // Use transient scope for stateful analysis service
    .inTransientScope();
});
