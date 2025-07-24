/**
 * Analyze Tree Shaking Use Case
 *
 * Application layer use case for analyzing tree-shaking optimization opportunities
 * in monorepo packages. Identifies barrel export issues, re-export chains, and
 * provides recommendations for better tree-shaking.
 */

import { inject, injectable } from "inversify";
import fs from "node:fs";
import path from "node:path";

import type {
  AutoFixPreview,
  ComprehensiveAutoFixOptions,
  FileAnalysis,
  TreeShakingAnalysisPort,
} from "../ports/analysis/tree-shaking.analysis.port";
import type { FileFinderServicePort } from "../ports/services/file-finder.service.port";
import type { LoggingServicePort } from "../ports/services/logging.service.port";

import { TYPES } from "../../shared/di/types";

export interface AnalyzeTreeShakingInput {
  comprehensive?: boolean;
  createBackup?: boolean;
  excludeDirectories?: string[];
  excludePatterns?: string[];
  fix?: boolean;
  maxReexportDepth?: number;
  maxWildcardExports?: number;
  packageName?: string;
  packagesPath?: string;
  preserveTypeExports?: boolean;
  preview?: boolean;
  removeIntermediateFiles?: boolean;
}

export interface TreeShakingIssue {
  description: string;
  file: string;
  line?: number;
  recommendation: string;
  severity: "critical" | "high" | "low" | "medium";
  type: "deep-reexport" | "large-barrel" | "unused-export" | "wildcard-export";
}

export interface PackageAnalysis {
  exportCount: number;
  indexFile: string;
  issues: TreeShakingIssue[];
  packageName: string;
  packagePath: string;
  reexportDepth: number;
  treeShakingScore: number; // 0-100, higher is better
}

@injectable()
export class AnalyzeTreeShakingUseCase {
  constructor(
    @inject(TYPES.LoggingServicePort)
    private readonly loggingService: LoggingServicePort,
    @inject(TYPES.FileFinderServicePort)
    private readonly fileFinderService: FileFinderServicePort,
    @inject(TYPES.TreeShakingAnalysisPort)
    private readonly treeShakingAnalysisService: TreeShakingAnalysisPort,
  ) {}

  async execute(input: AnalyzeTreeShakingInput = {}): Promise<PackageAnalysis[]> {
    const {
      comprehensive = false,
      createBackup = true,
      excludeDirectories = [],
      excludePatterns = [],
      fix = false,
      maxReexportDepth = 3,
      maxWildcardExports = 10,
      packageName,
      packagesPath = "packages",
      preserveTypeExports = true,
      preview = false,
      removeIntermediateFiles = false
    } = input;

    this.loggingService.startSection("Analyzing tree-shaking optimization opportunities...");

    try {
      // Find all packages or specific package
      const packageDirectories = await this.findPackages(packagesPath, packageName);

      if (packageDirectories.length === 0) {
        this.loggingService.warning("No packages found to analyze");

        return [];
      }

      this.loggingService.step(`Found ${packageDirectories.length} package(s) to analyze`);

      const analyses: PackageAnalysis[] = [];

      for (const packageDirectory of packageDirectories) {
        const analysis = await this.analyzePackage(packageDirectory);

        // Skip packages that don't have JS/TS files (analyzePackage returns null)
        if (analysis === null) {
          continue;
        }

        analyses.push(analysis);

        // Apply comprehensive auto-fix if requested
        if (comprehensive && (fix || preview)) {
          await this.applyComprehensiveAutoFix(analysis, {
            createBackup,
            excludeDirectories,
            excludePatterns,
            maxReexportDepth,
            maxWildcardExports,
            preserveTypeExports,
            preview,
            removeIntermediateFiles
          });
        }
        // Apply legacy auto-fix if requested (and not using comprehensive mode)
        else if (
          fix &&
          !comprehensive &&
          analysis.issues.some(
            (issue) => issue.type === "wildcard-export" || issue.type === "deep-reexport",
          )
        ) {
          await this.applyAutoFix(analysis);
        }
      }

      // Display summary
      this.displaySummary(analyses);

      return analyses;
    } catch (error) {
      this.loggingService.error(`Error analyzing tree-shaking: ${String(error)}`);

      return [];
    }
  }

  private async findPackages(packagesPath: string, packageName?: string): Promise<string[]> {
    if (packageName) {
      const packagePath = path.join(packagesPath, packageName);
      const exists = fs.existsSync(packagePath);

      return exists ? [packagePath] : [];
    }

    // Use fast-glob to find all package directories efficiently
    const pattern = `${packagesPath}/*/package.json`;
    const packageJsonFiles = await this.fileFinderService.findFiles(pattern, {
      absolute: true,
      onlyFiles: true,
    });

    return packageJsonFiles.map((file) => path.dirname(file));
  }

  private async hasJavaScriptOrTypeScriptFiles(packagePath: string): Promise<boolean> {
    try {
      // Look for JS/TS files in common source directories
      const patterns = [
        `${packagePath}/src/**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}`,
        `${packagePath}/dist/**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}`,
        `${packagePath}/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}`,
      ];

      for (const pattern of patterns) {
        const files = await this.fileFinderService.findFiles(pattern, {
          absolute: true,
          onlyFiles: true,
        });

        if (files.length > 0) {
          return true;
        }
      }

      return false;
    } catch {
      // If there are error checking files, assume the package might have JS/TS files
      // to avoid accidentally skipping packages that should be analyzed
      return true;
    }
  }

  private async analyzePackage(packagePath: string): Promise<null | PackageAnalysis> {
    const packageName = path.basename(packagePath);
    const indexFile = path.join(packagePath, "src", "index.ts");

    this.loggingService.item(`Analyzing package: ${packageName}`);

    // Check if the package contains any JavaScript or TypeScript files
    const hasJsTsFiles = await this.hasJavaScriptOrTypeScriptFiles(packagePath);

    if (!hasJsTsFiles) {
      this.loggingService.item(`Skipping ${packageName}: No JavaScript/TypeScript files found`);

      return null;
    }

    const analysis: PackageAnalysis = {
      exportCount: 0,
      indexFile,
      issues: [],
      packageName,
      packagePath,
      reexportDepth: 0,
      treeShakingScore: 100,
    };

    // Check if an index file exists
    if (!this.treeShakingAnalysisService.isTypeScriptFile(indexFile) || !fs.existsSync(indexFile)) {
      analysis.issues.push({
        description: "No index.ts file found",
        file: indexFile,
        recommendation: "Consider adding an index.ts file for better package exports",
        severity: "low",
        type: "unused-export",
      });
      analysis.treeShakingScore = 90;

      return analysis;
    }

    try {
      // Use AST-based analysis instead of regex
      const fileAnalysis = await this.treeShakingAnalysisService.analyzeFile(indexFile);

      analysis.exportCount = fileAnalysis.exports.length;
      analysis.reexportDepth = fileAnalysis.reexportDepth;

      // Analyze export patterns and identify issues
      await this.analyzeExportPatterns(analysis, fileAnalysis);

      // Find and analyze all index.ts files in the package for intermediate file detection
      await this.findAndAnalyzeIntermediateFiles(analysis, packagePath);

      // Calculate a tree-shaking score based on enhanced criteria
      analysis.treeShakingScore = this.calculateEnhancedTreeShakingScore(analysis);
    } catch (error) {
      analysis.issues.push({
        description: `Error analyzing file: ${String(error)}`,
        file: indexFile,
        recommendation: "Check file syntax and structure",
        severity: "medium",
        type: "unused-export",
      });
      analysis.treeShakingScore = 50;
    }

    return analysis;
  }

  private async analyzeExportPatterns(
    analysis: PackageAnalysis,
    fileAnalysis: FileAnalysis,
  ): Promise<void> {
    for (const exportInfo of fileAnalysis.exports) {
      // Only penalize problematic patterns, not all named exports
      if (exportInfo.type === "wildcard" && exportInfo.isReexport) {
        analysis.issues.push({
          description: `Wildcard export from "${exportInfo.moduleSpecifier ?? "unknown"}" prevents tree-shaking`,
          file: analysis.indexFile,
          line: exportInfo.line,
          recommendation: "Use named exports instead of wildcard exports for better tree-shaking",
          severity: "high",
          type: "wildcard-export",
        });
      }

      // Check for deep re-export chains (only problematic ones)
      if (exportInfo.isReexport && exportInfo.moduleSpecifier?.startsWith("./")) {
        const depth = await this.treeShakingAnalysisService.calculateReexportDepth(
          path.resolve(path.dirname(analysis.indexFile), exportInfo.moduleSpecifier),
        );

        if (depth > 3) {
          analysis.issues.push({
            description: `Deep re-export chain (depth: ${depth}) from "${exportInfo.moduleSpecifier ?? "unknown"}"`,
            file: analysis.indexFile,
            line: exportInfo.line,
            recommendation: "Consider flattening the export structure to reduce re-export depth",
            severity: "medium",
            type: "deep-reexport",
          });
        }
      }
    }

    // Only warn about large barrel exports if they're problematic (many wildcard exports)
    const wildcardExports = fileAnalysis.exports.filter((exp) => exp.type === "wildcard");

    if (wildcardExports.length > 10) {
      analysis.issues.push({
        description: `Large number of wildcard exports (${wildcardExports.length}) creates tree-shaking issues`,
        file: analysis.indexFile,
        recommendation: "Convert wildcard exports to named exports for better tree-shaking",
        severity: "critical",
        type: "large-barrel",
      });
    }
  }

  private async findAndAnalyzeIntermediateFiles(
    analysis: PackageAnalysis,
    packagePath: string,
  ): Promise<void> {
    // Find all index.ts files in the package using fast-glob
    const indexPattern = `${packagePath}/**/index.ts`;
    const indexFiles = await this.fileFinderService.findFiles(indexPattern, {
      absolute: true,
      onlyFiles: true,
    });

    // Filter out the main index file and analyze the rest
    const intermediateFiles = indexFiles.filter((file) => file !== analysis.indexFile);

    for (const indexFile of intermediateFiles) {
      try {
        const isIntermediate =
          await this.treeShakingAnalysisService.isIntermediateIndexFile(indexFile);

        if (isIntermediate) {
          const fileAnalysis = await this.treeShakingAnalysisService.analyzeFile(indexFile);
          const depth = fileAnalysis.reexportDepth;

          // Update the maximum re-export depth
          analysis.reexportDepth = Math.max(analysis.reexportDepth, depth);

          // Add issue for intermediate files that create deep chains
          if (depth > 2) {
            analysis.issues.push({
              description: `Intermediate index file creates ${depth}-level re-export chain`,
              file: indexFile,
              recommendation: "Consider flattening exports to the main index.ts file",
              severity: depth > 3 ? "high" : "medium",
              type: "deep-reexport",
            });
          }

          // Check for wildcard exports in intermediate files
          const wildcardExports = fileAnalysis.exports.filter((exp) => exp.type === "wildcard");

          if (wildcardExports.length > 0) {
            analysis.issues.push({
              description: `Intermediate file contains ${wildcardExports.length} wildcard export(s)`,
              file: indexFile,
              recommendation: "Convert to named exports or flatten to main index.ts",
              severity: "high",
              type: "wildcard-export",
            });
          }
        }
      } catch (error) {
        // Skip files that can't be analyzed
        this.loggingService.warning(
          `Failed to analyze intermediate file ${indexFile}: ${String(error)}`,
        );
      }
    }
  }

  private calculateEnhancedTreeShakingScore(analysis: PackageAnalysis): number {
    let score = 100;

    // Enhanced scoring that only penalizes problematic patterns
    for (const issue of analysis.issues) {
      switch (issue.severity) {
        case "critical": {
          score -= 30;
          break;
        }

        case "high": {
          score -= 20;
          break;
        }

        case "medium": {
          score -= 10;
          break;
        }

        case "low": {
          score -= 5;
          break;
        }
      }
    }

    // Only penalize deep re-export chains (not all re-exports)
    if (analysis.reexportDepth > 4) {
      score -= 20;
    } else if (analysis.reexportDepth > 3) {
      score -= 10;
    }

    // Don't penalize large numbers of named exports (this is actually good practice)
    // Only penalize if there are many wildcard exports
    const wildcardIssues = analysis.issues.filter((issue) => issue.type === "wildcard-export");

    if (wildcardIssues.length > 5) {
      score -= 15;
    }

    return Math.max(0, score);
  }

  private async applyAutoFix(analysis: PackageAnalysis): Promise<void> {
    this.loggingService.info(`🔧 Applying auto-fix for package: ${analysis.packageName}`);

    try {
      // Find all intermediate index files in the package
      const packagePath = analysis.packagePath;
      const indexPattern = `${packagePath}/**/index.ts`;
      const allIndexFiles = await this.fileFinderService.findFiles(indexPattern, {
        absolute: true,
        onlyFiles: true,
      });

      const intermediateFiles: string[] = [];

      for (const indexFile of allIndexFiles) {
        if (indexFile !== analysis.indexFile) {
          const isIntermediate =
            await this.treeShakingAnalysisService.isIntermediateIndexFile(indexFile);

          if (isIntermediate) {
            intermediateFiles.push(indexFile);
          }
        }
      }

      if (intermediateFiles.length > 0) {
        // Flatten exports from intermediate files to the main index file
        await this.treeShakingAnalysisService.flattenExports(intermediateFiles, {
          createBackup: true,
          preserveTypeExports: true,
          removeIntermediateFiles: true,
          targetIndexFile: analysis.indexFile,
        });

        this.loggingService.success(
          `Flattened ${intermediateFiles.length} intermediate files to ${analysis.indexFile}`,
        );

        // Re-analyze the package after fixes
        const updatedAnalysis = await this.analyzePackage(analysis.packagePath);

        // If the re-analysis returns null (shouldn't happen since we're fixing an existing package),
        // we'll keep the original analysis
        if (updatedAnalysis !== null) {
          analysis.issues = updatedAnalysis.issues;
          analysis.treeShakingScore = updatedAnalysis.treeShakingScore;
          analysis.exportCount = updatedAnalysis.exportCount;
          analysis.reexportDepth = updatedAnalysis.reexportDepth;
        }
      }
    } catch (error) {
      this.loggingService.error(`Failed to apply auto-fix: ${String(error)}`);
    }
  }

  private async applyComprehensiveAutoFix(
    analysis: PackageAnalysis,
    options: ComprehensiveAutoFixOptions,
  ): Promise<void> {
    const packagePath = analysis.packagePath;

    if (options.preview) {
      this.loggingService.info(`🔍 Generating preview for package: ${analysis.packageName}`);

      try {
        const preview = await this.treeShakingAnalysisService.generateAutoFixPreview(packagePath, options);

        this.displayAutoFixPreview(analysis.packageName, preview);

        return;
      } catch (error) {
        this.loggingService.error(`Failed to generate preview: ${String(error)}`);

        return;
      }
    }

    this.loggingService.info(`🔧 Applying comprehensive auto-fix for package: ${analysis.packageName}`);

    try {
      const backupInfos = await this.treeShakingAnalysisService.applyComprehensiveAutoFix(packagePath, options);

      if (backupInfos.length > 0) {
        this.loggingService.success(
          `Created ${backupInfos.length} backup file(s) for ${analysis.packageName}`,
        );
      }

      // Re-analyze the package after comprehensive fixes
      const updatedAnalysis = await this.analyzePackage(analysis.packagePath);

      if (updatedAnalysis !== null) {
        analysis.issues = updatedAnalysis.issues;
        analysis.treeShakingScore = updatedAnalysis.treeShakingScore;
        analysis.exportCount = updatedAnalysis.exportCount;
        analysis.reexportDepth = updatedAnalysis.reexportDepth;

        this.loggingService.success(
          `Comprehensive auto-fix completed for ${analysis.packageName}. New score: ${analysis.treeShakingScore}/100`,
        );
      }
    } catch (error) {
      this.loggingService.error(`Failed to apply comprehensive auto-fix: ${String(error)}`);
    }
  }

  private displayAutoFixPreview(packageName: string, preview: AutoFixPreview): void {
    this.loggingService.step(`Preview for ${packageName}`);

    // Summary
    this.loggingService.item(`Files to create: ${preview.filesToCreate.length}`);
    this.loggingService.item(`Files to modify: ${preview.filesToModify.length}`);
    this.loggingService.item(`Files to delete: ${preview.filesToDelete.length}`);
    this.loggingService.item(`Backup files: ${preview.backupFiles.length}`);

    // Detailed summary
    const { summary } = preview;

    if (summary.indexFilesCreated > 0) {
      this.loggingService.item(`Index files to create: ${summary.indexFilesCreated}`, 1);
    }

    if (summary.wildcardExportsConverted > 0) {
      this.loggingService.item(`Wildcard exports to convert: ${summary.wildcardExportsConverted}`, 1);
    }

    if (summary.intermediateFilesFlattened > 0) {
      this.loggingService.item(`Intermediate files to flatten: ${summary.intermediateFilesFlattened}`, 1);
    }

    if (summary.deepReexportChainsFixed > 0) {
      this.loggingService.item(`Deep re-export chains to fix: ${summary.deepReexportChainsFixed}`, 1);
    }

    // Files to create
    if (preview.filesToCreate.length > 0) {
      this.loggingService.step("Files to create:");

      for (const file of preview.filesToCreate) {
        this.loggingService.item(file, 1);
      }
    }

    // Files to modify
    if (preview.filesToModify.length > 0) {
      this.loggingService.step("Files to modify:");

      for (const file of preview.filesToModify) {
        this.loggingService.item(file, 1);
      }
    }

    // Files to delete
    if (preview.filesToDelete.length > 0) {
      this.loggingService.step("Files to delete:");

      for (const file of preview.filesToDelete) {
        this.loggingService.item(file, 1);
      }
    }

    this.loggingService.spacing();
  }

  private displaySummary(analyses: PackageAnalysis[]): void {
    this.loggingService.step("Tree-Shaking Analysis Summary");

    const totalIssues = analyses.reduce((sum, analysis) => sum + analysis.issues.length, 0);
    const avgScore =
      analyses.reduce((sum, analysis) => sum + analysis.treeShakingScore, 0) / analyses.length;

    // Overview statistics
    this.loggingService.step("Overview Statistics");
    this.loggingService.item(`Packages analyzed: ${analyses.length}`);
    this.loggingService.item(`Total issues found: ${totalIssues}`);
    this.loggingService.item(`Average score: ${avgScore.toFixed(1)}/100`);

    // Group by severity
    const criticalIssues = analyses.flatMap((a) =>
      a.issues.filter((index) => index.severity === "critical"),
    );
    const highIssues = analyses.flatMap((a) =>
      a.issues.filter((index) => index.severity === "high"),
    );
    const mediumIssues = analyses.flatMap((a) =>
      a.issues.filter((index) => index.severity === "medium"),
    );
    const lowIssues = analyses.flatMap((a) => a.issues.filter((index) => index.severity === "low"));

    // Issues breakdown
    if (totalIssues > 0) {
      this.loggingService.step("Issues Breakdown");

      if (criticalIssues.length > 0) {
        this.loggingService.result(`Critical issues: ${criticalIssues.length}`, "error");
      }

      if (highIssues.length > 0) {
        this.loggingService.result(`High priority issues: ${highIssues.length}`, "warning");
      }

      if (mediumIssues.length > 0) {
        this.loggingService.item(`Medium priority issues: ${mediumIssues.length}`);
      }

      if (lowIssues.length > 0) {
        this.loggingService.item(`Low priority issues: ${lowIssues.length}`);
      }

      // Show detailed issues for each package
      this.loggingService.step("Detailed Issues by Package");

      const packagesWithIssues = analyses.filter((analysis) => analysis.issues.length > 0);

      for (const analysis of packagesWithIssues) {
        this.loggingService.result(
          `${analysis.packageName} (Score: ${analysis.treeShakingScore}/100)`,
          analysis.treeShakingScore < 60
            ? "error"
            : analysis.treeShakingScore < 80
              ? "warning"
              : "success",
        );

        for (const issue of analysis.issues) {
          const typeLabel = {
            "deep-reexport": "Deep Re-export",
            "large-barrel": "Large Barrel File",
            "unused-export": "Unused Export",
            "wildcard-export": "Wildcard Export",
          }[issue.type];

          this.loggingService.item(`${typeLabel}: ${issue.description}`, 2);
          this.loggingService.item(`File: ${issue.file}`, 2);

          if (issue.line) {
            this.loggingService.item(`Line: ${issue.line}`, 2);
          }

          this.loggingService.item(`Recommendation: ${issue.recommendation}`, 2);
        }
      }
    }

    // Show worst packages
    const worstPackages = analyses
      .filter((a) => a.treeShakingScore < 80)
      .sort((a, b) => a.treeShakingScore - b.treeShakingScore)
      .slice(0, 5);

    if (worstPackages.length > 0) {
      this.loggingService.step("Packages Needing Attention");

      for (const pkg of worstPackages) {
        this.loggingService.result(
          `${pkg.packageName}: ${pkg.treeShakingScore}/100 (${pkg.issues.length} issues)`,
          "warning",
        );
      }
    }

    // Show the best packages
    const bestPackages = analyses
      .filter((a) => a.treeShakingScore >= 90)
      .sort((a, b) => b.treeShakingScore - a.treeShakingScore);

    if (bestPackages.length > 0) {
      this.loggingService.step("Well-Optimized Packages");

      for (const pkg of bestPackages) {
        this.loggingService.result(`${pkg.packageName}: ${pkg.treeShakingScore}/100`, "success");
      }
    }

    this.loggingService.spacing();
    this.loggingService.finishSection("Analysis Complete");
  }
}
