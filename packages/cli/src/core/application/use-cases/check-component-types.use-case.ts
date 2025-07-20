/**
 * Check Component Types Use Case
 *
 * Application layer use case for checking React component type correspondence.
 * Following explicit architecture guidelines for CLI applications.
 */

import { inject, injectable } from "inversify";

import type {
  ComponentAnalysisResult,
  ComponentAnalysisService,
} from "@/core/application/ports/component-analysis.port";
import type { LoggingService } from "@/core/application/ports/logging.port";

import { TYPES } from "@/di/types";

export interface CheckComponentTypesInput {
  packagesDirectory?: string;
}

@injectable()
export class CheckComponentTypesUseCase {
  constructor(
    @inject(TYPES.LoggingService) private readonly loggingService: LoggingService,
    @inject(TYPES.ComponentAnalysisService)
    private readonly componentAnalysisService: ComponentAnalysisService,
  ) {}

  execute(input: CheckComponentTypesInput = {}): void {
    const { packagesDirectory = "packages" } = input;

    this.loggingService.startSection("Component Type Analysis");
    this.loggingService.step("Discovering packages");

    try {
      // Discover all packages
      const packages = this.componentAnalysisService.discoverPackages(packagesDirectory);

      this.loggingService.continue(`Found ${packages.length} packages`);

      const results: ComponentAnalysisResult[] = [];

      this.loggingService.step("Analyzing components");

      // Process each package
      for (const packageName of packages) {
        const packagePath = `${packagesDirectory}/${packageName}`;

        // Find components in this package
        const components = this.componentAnalysisService.findComponentsInPackage(
          packagePath,
          packageName,
        );

        // Analyze each component
        for (const componentInfo of components) {
          const result = this.componentAnalysisService.analyzeComponentFile(componentInfo);

          if (result) {
            results.push(result);
          }
        }
      }

      this.loggingService.continue(`Analyzed ${results.length} components`);

      // Generate and display report
      this.generateReport(results);
    } catch (error) {
      this.loggingService.result(`Error analyzing component types: ${String(error)}`, "error");
    }
  }

  private generateReport(results: ComponentAnalysisResult[]): void {
    this.loggingService.step("Generating report");

    // Categorize results
    const componentsWithCorrespondenceIssues = results.filter((r) => r.hasCorrespondenceIssues);
    const componentsWithProperCorrespondence = results.filter(
      (r) => !r.hasCorrespondenceIssues && r.exportedComponents.length > 0,
    );
    const componentsWithFalsePositiveTypes = results.filter((r) => r.hasFalsePositiveTypes);

    // Report proper correspondence with improved formatting
    if (componentsWithProperCorrespondence.length > 0) {
      this.loggingService.step(
        `Components with proper correspondence (${componentsWithProperCorrespondence.length})`,
      );

      this.reportProperCorrespondenceImproved(componentsWithProperCorrespondence);
    }

    // Report correspondence issues
    if (componentsWithCorrespondenceIssues.length > 0) {
      this.loggingService.step(
        `Components with correspondence issues (${componentsWithCorrespondenceIssues.length})`,
      );

      for (const result of componentsWithCorrespondenceIssues) {
        this.loggingService.result(`${result.package}/${result.component}`, "error");
        this.loggingService.item(`File: ${result.file}`, 2);
        this.loggingService.item(`Components: ${result.actualComponents.join(", ") || "None"}`, 2);
        this.loggingService.item(`Types: ${result.exportedTypes.join(", ") || "None"}`, 2);

        if (result.exportedComponents.length !== result.actualComponents.length) {
          const filtered = result.exportedComponents.filter(
            (c) => !result.actualComponents.includes(c),
          );

          this.loggingService.item(`Filtered: ${filtered.join(", ")}`, 2);
        }

        if (result.missingTypeExports.length > 0) {
          this.loggingService.item("Missing type exports:", 2);
          for (const missing of result.missingTypeExports) {
            this.loggingService.item(`${missing.component} → ${missing.expectedType}`, 3);
          }
        }

        for (const corr of result.componentTypeCorrespondence) {
          this.loggingService.item(`${corr.component} → ${corr.expectedType}`, 2);
        }
      }
    }

    // Report false positive types
    if (componentsWithFalsePositiveTypes.length > 0) {
      this.loggingService.step(
        `Components with false positive types (${componentsWithFalsePositiveTypes.length})`,
      );

      for (const result of componentsWithFalsePositiveTypes) {
        this.loggingService.result(`${result.package}/${result.component}`, "warning");
        this.loggingService.item(`File: ${result.file}`, 2);
        this.loggingService.item(`Components: ${result.actualComponents.join(", ") || "None"}`, 2);
        this.loggingService.item(`Types: ${result.exportedTypes.join(", ") || "None"}`, 2);

        if (result.falsePositiveTypeExports.length > 0) {
          this.loggingService.item("False positive type exports:", 2);
          for (const falsePositive of result.falsePositiveTypeExports) {
            this.loggingService.item(
              `${falsePositive.typeName} (expected: ${falsePositive.expectedComponent})`,
              3,
            );
          }
        }
      }
    }

    // Summary
    this.loggingService.step("Summary");
    this.loggingService.continue(`Total components: ${results.length}`);
    this.loggingService.continue(
      `Proper correspondence: ${componentsWithProperCorrespondence.length}`,
    );
    this.loggingService.continue(
      `Correspondence issues: ${componentsWithCorrespondenceIssues.length}`,
    );
    this.loggingService.continue(
      `False positive types: ${componentsWithFalsePositiveTypes.length}`,
    );
  }

  private reportProperCorrespondenceImproved(results: ComponentAnalysisResult[]): void {
    // Group results by package for better organization
    const packageGroups = new Map<string, ComponentAnalysisResult[]>();

    for (const result of results) {
      const packageName = result.package;

      if (!packageGroups.has(packageName)) {
        packageGroups.set(packageName, []);
      }
      const packageResults = packageGroups.get(packageName);

      if (packageResults) {
        packageResults.push(result);
      }
    }

    // Sort packages alphabetically
    const sortedPackages = [...packageGroups.keys()].sort();

    for (const packageName of sortedPackages) {
      const packageResults = packageGroups.get(packageName);

      if (!packageResults) {
        continue;
      }

      // Package header with component count
      this.loggingService.result(
        `📦 ${packageName} (${packageResults.length} components)`,
        "success",
      );

      // Sort components within package
      const sortedResults = packageResults.sort((a, b) => a.component.localeCompare(b.component));

      for (const result of sortedResults) {
        // Component name with compact info
        const componentInfo = this.formatComponentInfo(result);

        this.loggingService.item(`${result.component} ${componentInfo}`, 2);

        // Show detailed info only for complex components (more than 3 components or types)
        const isComplex = result.actualComponents.length > 3 || result.exportedTypes.length > 3;

        if (isComplex) {
          this.loggingService.item(`└─ Components: ${result.actualComponents.join(", ")}`, 3);
          this.loggingService.item(`└─ Types: ${result.exportedTypes.join(", ")}`, 3);
        }
      }
    }

    // Summary statistics
    this.loggingService.item(
      `📊 Summary: ${sortedPackages.length} packages, ${results.length} components`,
      1,
    );
  }

  private formatComponentInfo(result: ComponentAnalysisResult): string {
    const componentCount = result.actualComponents.length;
    const typeCount = result.exportedTypes.length;

    // Create a compact representation
    const parts: string[] = [];

    if (componentCount === 1 && typeCount === 1) {
      // Simple case: 1 component, 1 type
      parts.push(`✓ 1:1`);
    } else {
      // Complex case: show counts
      parts.push(`✓ ${componentCount}c:${typeCount}t`);
    }

    // Add a filtered count if there are filtered exports
    const filteredCount = result.exportedComponents.length - result.actualComponents.length;

    if (filteredCount > 0) {
      parts.push(`(${filteredCount} filtered)`);
    }

    return parts.join(" ");
  }
}
