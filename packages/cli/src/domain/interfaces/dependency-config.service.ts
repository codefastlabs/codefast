/**
 * Interface for accessing dependency configuration for project creation.
 */
export interface DependencyConfigServiceInterface {
  getDevDependencies: () => Record<string, string[]>;
  getMainDependencies: () => string[];
  getPackagesToRemove: () => string[];
}
