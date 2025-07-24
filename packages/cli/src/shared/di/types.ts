/**
 * Dependency Injection Types
 *
 * This file defines service identifiers as Symbols for use with InversifyJS.
 * Following explicit architecture guidelines for CLI applications.
 */

export const TYPES = {
  // Ports
  ComponentAnalysisPort: Symbol.for("ComponentAnalysisPort"),
  FileFinderServicePort: Symbol.for("FileFinderServicePort"),
  FilesystemSystemPort: Symbol.for("FilesystemSystemPort"),
  LoggingServicePort: Symbol.for("LoggingServicePort"),
  TreeShakingAnalysisPort: Symbol.for("TreeShakingAnalysisPort"),
  TypeScriptAnalysisPort: Symbol.for("TypeScriptAnalysisPort"),

  // Application Services
  ProjectAnalysisApplicationService: Symbol.for("ProjectAnalysisApplicationService"),

  // Query Handlers
  GetProjectStatisticsQueryHandler: Symbol.for("GetProjectStatisticsQueryHandler"),

  // Use Cases (Legacy - to be refactored)
  AnalyzeProjectUseCase: Symbol.for("AnalyzeProjectUseCase"),
  AnalyzeTreeShakingUseCase: Symbol.for("AnalyzeTreeShakingUseCase"),
  CheckComponentTypesUseCase: Symbol.for("CheckComponentTypesUseCase"),
  GreetUserUseCase: Symbol.for("GreetUserUseCase"),

  // CLI Commands
  Command: Symbol.for("Command"),
  CommandHandler: Symbol.for("CommandHandler"),
  CommandRegistry: Symbol.for("CommandRegistry"),
} as const;
