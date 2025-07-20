/**
 * Component Analysis Port
 *
 * Application layer port for analyzing React components and their TypeScript types.
 * Following explicit architecture guidelines for CLI applications.
 */

export interface ComponentInfo {
  name: string;
  path: string;
  packageName: string;
}

export interface ComponentAnalysisResult {
  package: string;
  component: string;
  file: string;
  exportedComponents: string[];
  actualComponents: string[];
  exportedTypes: string[];
  componentTypeCorrespondence: Array<{
    component: string;
    expectedType: string;
    hasCorrespondingType: boolean;
  }>;
  missingTypeExports: Array<{
    component: string;
    expectedType: string;
  }>;
  falsePositiveTypeExports: Array<{
    typeName: string;
    expectedComponent: string;
  }>;
  hasCorrespondenceIssues: boolean;
  hasFalsePositiveTypes: boolean;
}

export interface ComponentAnalysisService {
  /**
   * Discover all packages in the packages directory
   */
  discoverPackages(packagesDir: string): Promise<string[]>;

  /**
   * Find components in a specific package
   */
  findComponentsInPackage(packagePath: string, packageName: string): Promise<ComponentInfo[]>;

  /**
   * Analyze a component file for exports and types
   */
  analyzeComponentFile(componentInfo: ComponentInfo): Promise<ComponentAnalysisResult | null>;

  /**
   * Check if an export name represents a React component
   */
  isComponent(exportName: string): boolean;
}
