import { Container } from "inversify";

import type { AnalysisPort } from "@/application/ports/analysis.port";
import type { CommandExecutorPort } from "@/application/ports/command-executor.port";
import type { FileSystemPort } from "@/application/ports/file-system.port";
import type { PromptPort } from "@/application/ports/prompt.port";
import type { ConfigServiceInterface } from "@/domain/interfaces/config.service";
import type { DependencyConfigServiceInterface } from "@/domain/interfaces/dependency-config.service";
import type { PackageInfoServiceInterface } from "@/domain/interfaces/package-info.service";
import type { PackageRepository } from "@/domain/interfaces/package.repository";
import type { ProjectRepositoryInterface } from "@/domain/interfaces/project.repository";

import { CreateProjectCommand } from "@/application/commands/create-project.command";
import { UpdateExportsCommand } from "@/application/commands/update-exports.command";
import { CreateProjectUseCase } from "@/application/use-cases/create-project.use-case";
import { UpdateExportsUseCase } from "@/application/use-cases/update-exports.use-case";
import { CLIAdapter } from "@/infrastructure/adapters/cli.adapter";
import { NodeCommandExecutorAdapter } from "@/infrastructure/adapters/node-command-executor.adapter";
import { NodeFileSystemAdapter } from "@/infrastructure/adapters/node-file-system.adapter";
import { NodePromptAdapter } from "@/infrastructure/adapters/node-prompt.adapter";
import { TsMorphAnalysisAdapter } from "@/infrastructure/adapters/ts-morph-analysis.adapter";
import { FileSystemPackageRepository } from "@/infrastructure/repositories/file-system-package.repository";
import { FileSystemProjectRepository } from "@/infrastructure/repositories/file-system-project.repository";
import { ConfigService } from "@/infrastructure/services/config.service";
import { DependencyConfigService } from "@/infrastructure/services/dependency-config.service";
import { NodePackageInfoService } from "@/infrastructure/services/node-package-info.service";
import { FileSystemUtility } from "@/infrastructure/utilities/file-system-utility";
import { TYPES } from "@/ioc/types";

const container = new Container();

// Domain bindings
container.bind<ProjectRepositoryInterface>(TYPES.ProjectRepository).to(FileSystemProjectRepository).inSingletonScope(); // Handles project creation and file updates
container.bind<PackageRepository>(TYPES.PackageRepository).to(FileSystemPackageRepository).inSingletonScope(); // Manages package.json exports
container.bind<PackageInfoServiceInterface>(TYPES.PackageInfoService).to(NodePackageInfoService).inSingletonScope(); // Provides package version
container
  .bind<DependencyConfigServiceInterface>(TYPES.DependencyConfigService)
  .to(DependencyConfigService)
  .inSingletonScope(); // Provides dependency configuration
container.bind<ConfigServiceInterface>(TYPES.ConfigService).to(ConfigService).inSingletonScope(); // Provides CLI configuration

// Application bindings
container.bind<FileSystemPort>(TYPES.FileSystemPort).to(NodeFileSystemAdapter).inSingletonScope(); // File system operations
container.bind<CommandExecutorPort>(TYPES.CommandExecutorPort).to(NodeCommandExecutorAdapter).inSingletonScope(); // Command execution
container.bind<PromptPort>(TYPES.PromptPort).to(NodePromptAdapter).inSingletonScope(); // User input prompting
container.bind<AnalysisPort>(TYPES.AnalysisPort).to(TsMorphAnalysisAdapter).inSingletonScope(); // Import analysis
container.bind<CreateProjectUseCase>(TYPES.CreateProjectUseCase).to(CreateProjectUseCase).inSingletonScope(); // Project creation logic
container.bind<UpdateExportsUseCase>(TYPES.UpdateExportsUseCase).to(UpdateExportsUseCase).inSingletonScope(); // Export update logic
container.bind<CreateProjectCommand>(TYPES.CreateProjectCommand).to(CreateProjectCommand).inSingletonScope(); // CLI command for project creation
container.bind<UpdateExportsCommand>(TYPES.UpdateExportsCommand).to(UpdateExportsCommand).inSingletonScope(); // CLI command for export updates

// Infrastructure bindings
container.bind<CLIAdapter>(TYPES.CLIAdapter).to(CLIAdapter).inSingletonScope(); // CLI setup and command registration
container.bind<FileSystemUtility>(TYPES.FileSystemUtility).to(FileSystemUtility).inSingletonScope(); // File system utility functions

export { container };
