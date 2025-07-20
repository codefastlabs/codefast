/**
 * TypeScript Analysis Service Port
 *
 * Interface for TypeScript code analysis following explicit architecture guidelines.
 * This port abstracts TypeScript analysis operations from the infrastructure implementation.
 */

export interface ProjectStatistics {
  totalClasses: number;
  totalFiles: number;
  totalFunctions: number;
  totalInterfaces: number;
}

export interface TypeScriptAnalysisPort {
  /**
   * Create a TypeScript project for analysis
   */
  createProject: (tsConfigPath?: string) => void;

  /**
   * Add source files to the project for analysis
   */
  addSourceFiles: (filePaths: string[]) => void;

  /**
   * Get basic statistics about the TypeScript project
   */
  getProjectStatistics: () => ProjectStatistics;

  /**
   * Reset the project analysis
   */
  reset: () => void;
}
