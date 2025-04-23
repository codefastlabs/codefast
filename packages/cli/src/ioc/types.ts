export const TYPES = {
  ProjectRepository: Symbol.for("ProjectRepository"),
  PackageRepository: Symbol.for("PackageRepository"),

  FileSystemPort: Symbol.for("FileSystemPort"),
  CommandExecutorPort: Symbol.for("CommandExecutorPort"),
  PromptPort: Symbol.for("PromptPort"),
  AnalysisPort: Symbol.for("AnalysisPort"),

  PackageInfoService: Symbol.for("PackageInfoService"),
  DependencyConfigService: Symbol.for("DependencyConfigService"),
  ConfigService: Symbol.for("ConfigService"),

  FileSystemUtility: Symbol.for("FileSystemUtility"),

  CreateProjectUseCase: Symbol.for("CreateProjectUseCase"),
  UpdateExportsUseCase: Symbol.for("UpdateExportsUseCase"),

  CreateProjectCommand: Symbol.for("CreateProjectCommand"),
  UpdateExportsCommand: Symbol.for("UpdateExportsCommand"),

  CLIAdapter: Symbol.for("CLIAdapter"),
};
