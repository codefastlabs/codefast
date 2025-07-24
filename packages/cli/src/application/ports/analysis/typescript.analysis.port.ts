/**
 * TypeScript Analysis Service Port
 *
 * Interface for TypeScript code analysis following explicit architecture guidelines.
 * This port abstracts TypeScript analysis operations from the infrastructure implementation.
 */

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
   * Returns plain object that can be used to create ProjectStatistics value object
   */
  getProjectStatistics: () => {
    totalFiles: number;
    totalClasses: number;
    totalFunctions: number;
    totalInterfaces: number;
  };

  /**
   * Reset the project analysis
   */
  reset: () => void;
}
