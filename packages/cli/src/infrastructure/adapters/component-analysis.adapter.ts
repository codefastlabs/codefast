/**
 * Component Analysis Adapter
 *
 * Infrastructure layer adapter for analyzing React components and their TypeScript types.
 * Following explicit architecture guidelines for CLI applications.
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { injectable } from "inversify";

import type {
  ComponentAnalysisResult,
  ComponentAnalysisService,
  ComponentInfo,
} from "@/core/application/ports/component-analysis.port";

@injectable()
export class ComponentAnalysisAdapter implements ComponentAnalysisService {
  async discoverPackages(packagesDir: string): Promise<string[]> {
    try {
      const packages = readdirSync(packagesDir);
      return packages.filter((packageName) => {
        const packagePath = path.join(packagesDir, packageName);
        const stats = statSync(packagePath);
        return stats.isDirectory() && packageName !== ".DS_Store";
      });
    } catch (error) {
      throw new Error(`Failed to discover packages in ${packagesDir}: ${String(error)}`);
    }
  }

  async findComponentsInPackage(packagePath: string, packageName: string): Promise<ComponentInfo[]> {
    const componentsToCheck: ComponentInfo[] = [];

    try {
      // For ui package, check components in src/components/
      if (packageName === "ui") {
        const uiComponentsDir = path.join(packagePath, "src", "components");
        if (existsSync(uiComponentsDir)) {
          const uiComponents = readdirSync(uiComponentsDir);
          for (const componentName of uiComponents) {
            const componentPath = path.join(uiComponentsDir, componentName);
            const componentStats = statSync(componentPath);
            if (componentStats.isDirectory()) {
              componentsToCheck.push({
                name: componentName,
                path: componentPath,
                packageName: packageName,
              });
            }
          }
        }
      } else {
        // For other packages, check if they have components directly in src/
        const srcDir = path.join(packagePath, "src");
        if (existsSync(srcDir)) {
          // Check if this package has component files (tsx files that aren't test files)
          const srcFiles = readdirSync(srcDir);
          const hasComponentFiles = srcFiles.some(
            (file) => file.endsWith(".tsx") && !file.includes(".test.") && !file.includes(".spec."),
          );

          if (hasComponentFiles) {
            componentsToCheck.push({
              name: packageName,
              path: srcDir,
              packageName: packageName,
            });
          }
        }
      }

      return componentsToCheck;
    } catch (error) {
      throw new Error(`Failed to find components in package ${packageName}: ${String(error)}`);
    }
  }

  async analyzeComponentFile(componentInfo: ComponentInfo): Promise<ComponentAnalysisResult | null> {
    const { name: componentName, path: componentPath, packageName: pkgName } = componentInfo;

    try {
      // Check for a main component file
      const possibleFiles = [
        path.join(componentPath, `${componentName}.tsx`),
        path.join(componentPath, "index.tsx"),
        path.join(componentPath, "index.ts"),
      ];

      let mainFile: string | null = null;
      for (const file of possibleFiles) {
        if (existsSync(file)) {
          mainFile = file;
          break;
        }
      }

      if (!mainFile) {
        return null;
      }

      const content = readFileSync(mainFile, "utf8");

      // Extract exported components from export { ... } statements
      const exportComponentMatches = content.match(/export\s*\{\s*([^}]+)\s*\}/g) || [];
      const exportedComponents: string[] = [];
      for (const match of exportComponentMatches) {
        const componentsInExport = match.replace(/export\s*\{\s*/, "").replace(/\s*\}/, "");
        const components = componentsInExport
          .split(",")
          .map((c) => c.trim())
          .filter((c) => c);
        exportedComponents.push(...components);
      }

      // Extract exported types from export type { ... } statements
      const exportTypeMatches = content.match(/export\s+type\s*\{\s*([^}]+)\s*\}/g) || [];
      const exportedTypes: string[] = [];
      for (const match of exportTypeMatches) {
        const typesInExport = match.replace(/export\s+type\s*\{\s*/, "").replace(/\s*\}/, "");
        const types = typesInExport
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t);
        exportedTypes.push(...types);
      }

      // Filter exported components to only include actual React components
      const actualComponents = exportedComponents.filter((exportName) => this.isComponent(exportName));

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
              typeName,
              expectedComponent: expectedComponentName,
            });
          }
        }
      }

      return {
        package: pkgName,
        component: componentName,
        file: mainFile,
        exportedComponents,
        actualComponents,
        exportedTypes,
        componentTypeCorrespondence,
        missingTypeExports,
        falsePositiveTypeExports,
        hasCorrespondenceIssues: missingTypeExports.length > 0 && actualComponents.length > 0,
        hasFalsePositiveTypes: falsePositiveTypeExports.length > 0,
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
    if (exportName.match(/^[A-Z][A-Z_]*$/)) {
      return false;
    }

    // Exclude other common utility patterns
    if (exportName.startsWith("create") && !exportName.match(/^[A-Z]/)) {
      return false;
    }

    // Include only capitalized names that look like React components (PascalCase)
    return Boolean(exportName.match(/^[A-Z][a-zA-Z0-9]*$/));
  }
}
