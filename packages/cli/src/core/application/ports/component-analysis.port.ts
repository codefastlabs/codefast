/**
 * Component Analysis Port
 *
 * Application layer port for analyzing React components and their TypeScript types.
 * Following explicit architecture guidelines for CLI applications.
 */

export interface ComponentInfo {
  name: string;
  packageName: string;
  path: string;
}

export interface ComponentAnalysisResult {
  actualComponents: string[];
  component: string;
  componentTypeCorrespondence: {
    component: string;
    expectedType: string;
    hasCorrespondingType: boolean;
  }[];
  exportedComponents: string[];
  exportedTypes: string[];
  falsePositiveTypeExports: {
    typeName: string;
    expectedComponent: string;
  }[];
  file: string;
  hasCorrespondenceIssues: boolean;
  hasFalsePositiveTypes: boolean;
  missingTypeExports: {
    component: string;
    expectedType: string;
  }[];
  package: string;
}

export interface ComponentAnalysisService {
  /**
   * Discover all packages in the packages directory
   */
  discoverPackages: (packagesDirectory: string) => string[];

  /**
   * Find components in a specific package
   */
  findComponentsInPackage: (packagePath: string, packageName: string) => ComponentInfo[];

  /**
   * Analyze a component file for exports and types
   */
  analyzeComponentFile: (componentInfo: ComponentInfo) => ComponentAnalysisResult | null;

  /**
   * Check if an export name represents a React component
   */
  isComponent: (exportName: string) => boolean;
}
