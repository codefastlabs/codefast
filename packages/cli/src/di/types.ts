/**
 * Dependency Injection Types
 *
 * This file defines service identifiers as Symbols for use with InversifyJS.
 * Following explicit architecture guidelines for CLI applications.
 */

export const TYPES = {
  // Ports
  ComponentAnalysisPort: Symbol.for("ComponentAnalysisPort"),
  FilesystemSystemPort: Symbol.for("FilesystemSystemPort"),
  LoggingServicePort: Symbol.for("LoggingServicePort"),
  PathSystemPort: Symbol.for("PathSystemPort"),
  TypeScriptAnalysisPort: Symbol.for("TypeScriptAnalysisPort"),
  UrlSystemPort: Symbol.for("UrlSystemPort"),

  // Use Cases
  AnalyzeProjectUseCase: Symbol.for("AnalyzeProjectUseCase"),
  AnalyzeTreeShakingUseCase: Symbol.for("AnalyzeTreeShakingUseCase"),
  CheckComponentTypesUseCase: Symbol.for("CheckComponentTypesUseCase"),
  GreetUserUseCase: Symbol.for("GreetUserUseCase"),

  // CLI Commands
  Command: Symbol.for("Command"),
  CommandHandler: Symbol.for("CommandHandler"),
  CommandRegistry: Symbol.for("CommandRegistry"),
} as const;
