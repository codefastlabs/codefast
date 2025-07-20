/**
 * React Component Analysis Adapter
 *
 * Infrastructure layer adapter for analyzing React components and their TypeScript types.
 * Following explicit architecture guidelines for CLI applications.
 */

import { inject, injectable } from "inversify";

import type {
  ComponentAnalysisResult,
  ComponentAnalysisPort,
  ComponentInfo,
} from "@/core/application/ports/analysis/component.analysis.port";
import type { FileSystemSystemPort } from "@/core/application/ports/system/file-system.system.port";
import type { PathSystemPort } from "@/core/application/ports/system/path.system.port";

import { TYPES } from "@/di/types";

@injectable()
export class ReactComponentAnalysisAdapter implements ComponentAnalysisPort {
  constructor(
    @inject(TYPES.FilesystemSystemPort)
    private readonly fileSystemService: FileSystemSystemPort,
    @inject(TYPES.PathSystemPort)
    private readonly pathService: PathSystemPort,
  ) {}

  discoverPackages(packagesDirectory: string): string[] {
    try {
      const packages = this.fileSystemService.readdirSync(packagesDirectory);

      return packages.filter((packageName) => {
        const packagePath = this.pathService.join(packagesDirectory, packageName);
        const stats = this.fileSystemService.statSync(packagePath);

        return stats.isDirectory() && packageName !== ".DS_Store";
      });
    } catch (error) {
      throw new Error(`Failed to discover packages in ${packagesDirectory}: ${String(error)}`);
    }
  }

  findComponentsInPackage(packagePath: string, packageName: string): ComponentInfo[] {
    const componentsToCheck: ComponentInfo[] = [];

    try {
      // For ui package, check components in src/components/
      if (packageName === "ui") {
        const uiComponentsDirectory = this.pathService.join(packagePath, "src", "components");

        if (this.fileSystemService.existsSync(uiComponentsDirectory)) {
          const uiComponents = this.fileSystemService.readdirSync(uiComponentsDirectory);

          for (const componentName of uiComponents) {
            const componentPath = this.pathService.join(uiComponentsDirectory, componentName);
            const componentStats = this.fileSystemService.statSync(componentPath);

            if (componentStats.isDirectory()) {
              componentsToCheck.push({
                name: componentName,
                packageName: packageName,
                path: componentPath,
              });
            }
          }
        }
      } else {
        // For other packages, check if they have components directly in src/
        const sourceDirectory = this.pathService.join(packagePath, "src");

        if (this.fileSystemService.existsSync(sourceDirectory)) {
          // Check if this package has component files (tsx files that aren't test files)
          const sourceFiles = this.fileSystemService.readdirSync(sourceDirectory);
          const hasComponentFiles = sourceFiles.some(
            (file: string) =>
              file.endsWith(".tsx") && !file.includes(".test.") && !file.includes(".spec."),
          );

          if (hasComponentFiles) {
            componentsToCheck.push({
              name: packageName,
              packageName: packageName,
              path: sourceDirectory,
            });
          }
        }
      }

      return componentsToCheck;
    } catch (error) {
      throw new Error(`Failed to find components in package ${packageName}: ${String(error)}`);
    }
  }

  analyzeComponentFile(componentInfo: ComponentInfo): ComponentAnalysisResult | null {
    const { name: componentName, packageName: packageName, path: componentPath } = componentInfo;

    try {
      // Check for a main component file
      const possibleFiles = [
        this.pathService.join(componentPath, `${componentName}.tsx`),
        this.pathService.join(componentPath, "index.tsx"),
        this.pathService.join(componentPath, "index.ts"),
      ];

      let mainFile: null | string = null;

      for (const file of possibleFiles) {
        if (this.fileSystemService.existsSync(file)) {
          mainFile = file;
          break;
        }
      }

      if (!mainFile) {
        return null;
      }

      const content = this.fileSystemService.readFileSync(mainFile, "utf8");

      // Extract exported components from export { ... } statements
      const exportComponentMatches = content.match(/export\s*\{\s*([^}]+)\s*}/g) ?? [];
      const exportedComponents: string[] = [];

      for (const match of exportComponentMatches) {
        const componentsInExport = match.replace(/export\s*\{\s*/, "").replace(/\s*}/, "");
        const components = componentsInExport
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean);

        exportedComponents.push(...components);
      }

      // Extract exported types from an export type { ... } statements
      const exportTypeMatches = content.match(/export\s+type\s*\{\s*([^}]+)\s*}/g) ?? [];
      const exportedTypes: string[] = [];

      for (const match of exportTypeMatches) {
        const typesInExport = match.replace(/export\s+type\s*\{\s*/, "").replace(/\s*}/, "");
        const types = typesInExport
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);

        exportedTypes.push(...types);
      }

      // Filter exported components to only include actual React components
      const actualComponents = exportedComponents.filter((exportName) =>
        this.isComponent(exportName),
      );

      // Check correspondence between exported components and types
      const componentTypeCorrespondence = [];
      const missingTypeExports = [];
      const falsePositiveTypeExports = [];

      for (const component of actualComponents) {
        const expectedTypeName = `${component}Props`;
        const hasCorrespondingType = exportedTypes.includes(expectedTypeName);

        componentTypeCorrespondence.push({
          component,
          expectedType: expectedTypeName,
          hasCorrespondingType,
        });

        if (!hasCorrespondingType) {
          missingTypeExports.push({ component, expectedType: expectedTypeName });
        }
      }

      // Check for false positive type exports (types exported without corresponding component exports)
      for (const typeName of exportedTypes) {
        if (typeName.endsWith("Props")) {
          const expectedComponentName = typeName.replace(/Props$/, "");
          const hasCorrespondingComponent = actualComponents.includes(expectedComponentName);

          if (!hasCorrespondingComponent) {
            falsePositiveTypeExports.push({
              expectedComponent: expectedComponentName,
              typeName,
            });
          }
        }
      }

      return {
        actualComponents,
        component: componentName,
        componentTypeCorrespondence,
        exportedComponents,
        exportedTypes,
        falsePositiveTypeExports,
        file: mainFile,
        hasCorrespondenceIssues: missingTypeExports.length > 0 && actualComponents.length > 0,
        hasFalsePositiveTypes: falsePositiveTypeExports.length > 0,
        missingTypeExports,
        package: packageName,
      };
    } catch (error) {
      throw new Error(`Failed to analyze component file ${componentInfo.name}: ${String(error)}`);
    }
  }

  isComponent(exportName: string): boolean {
    // Exclude hooks (functions starting with "use")
    if (exportName.startsWith("use")) {
      return false;
    }

    // Exclude utility functions like createCarouselScope, createFormFieldScope, etc.
    if (exportName.startsWith("create") && exportName.endsWith("Scope")) {
      return false;
    }

    // Exclude constants (all uppercase with underscores)
    if (/^[A-Z][A-Z_]*$/.test(exportName)) {
      return false;
    }

    // Exclude other common utility patterns
    if (exportName.startsWith("create") && !/^[A-Z]/.test(exportName)) {
      return false;
    }

    // Include only capitalized names that look like React components (PascalCase)
    return Boolean(/^[A-Z][a-zA-Z0-9]*$/.test(exportName));
  }
}
