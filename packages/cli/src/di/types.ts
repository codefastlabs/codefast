/**
 * Dependency Injection Types
 *
 * This file defines service identifiers as Symbols for use with InversifyJS.
 * Following explicit architecture guidelines for CLI applications.
 */

// Application Layer - Ports
export const TYPES = {
  // Logging Service
  LoggingService: Symbol.for("LoggingService"),

  // File System Service
  FileSystemService: Symbol.for("FileSystemService"),

  // TypeScript Analysis Service
  TypeScriptAnalysisService: Symbol.for("TypeScriptAnalysisService"),

  // Use Cases
  AnalyzeProjectUseCase: Symbol.for("AnalyzeProjectUseCase"),
  GreetUserUseCase: Symbol.for("GreetUserUseCase"),

  // CLI Presentation
  CLIApplication: Symbol.for("CLIApplication"),
} as const;
