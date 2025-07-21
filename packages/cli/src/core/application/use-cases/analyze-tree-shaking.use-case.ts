/**
 * Analyze Tree Shaking Use Case
 *
 * Application layer use case for analyzing tree-shaking optimization opportunities
 * in monorepo packages. Identifies barrel export issues, re-export chains, and
 * provides recommendations for better tree-shaking.
 */

import { inject, injectable } from "inversify";

import type { LoggingServicePort } from "@/core/application/ports/services/logging.service.port";
import type { FileSystemSystemPort } from "@/core/application/ports/system/file-system.system.port";
import type { PathSystemPort } from "@/core/application/ports/system/path.system.port";

import { TYPES } from "@/di/types";

export interface AnalyzeTreeShakingInput {
  fix?: boolean;
  packageName?: string;
  packagesPath?: string;
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
    @inject(TYPES.FilesystemSystemPort)
    private readonly fileSystemService: FileSystemSystemPort,
    @inject(TYPES.PathSystemPort)
    private readonly pathService: PathSystemPort,
  ) {}

  async execute(input: AnalyzeTreeShakingInput = {}): Promise<PackageAnalysis[]> {
    const { packageName, packagesPath = "packages" } = input;

    this.loggingService.info("🌳 Analyzing tree-shaking optimization opportunities...");

    try {
      // Find all packages or specific package
      const packageDirectories = await this.findPackages(packagesPath, packageName);

      if (packageDirectories.length === 0) {
        this.loggingService.warning("No packages found to analyze");

        return [];
      }

      this.loggingService.info(`Found ${packageDirectories.length} package(s) to analyze`);

      const analyses: PackageAnalysis[] = [];

      for (const packageDirectory of packageDirectories) {
        const analysis = await this.analyzePackage(packageDirectory);

        analyses.push(analysis);
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
      const packagePath = this.pathService.join(packagesPath, packageName);
      const exists = this.fileSystemService.existsSync(packagePath);

      return exists ? [packagePath] : [];
    }

    // Find all package directories
    const pattern = this.pathService.join(packagesPath, "*/package.json");
    const packageJsonFiles = await this.fileSystemService.findFiles(pattern);

    return packageJsonFiles.map((file) => this.pathService.dirname(file));
  }

  private async analyzePackage(packagePath: string): Promise<PackageAnalysis> {
    const packageName = this.pathService.basename(packagePath);
    const indexFile = this.pathService.join(packagePath, "src", "index.ts");

    this.loggingService.info(`📦 Analyzing package: ${packageName}`);

    const analysis: PackageAnalysis = {
      exportCount: 0,
      indexFile,
      issues: [],
      packageName,
      packagePath,
      reexportDepth: 0,
      treeShakingScore: 100,
    };

    // Check if index file exists
    const indexExists = this.fileSystemService.existsSync(indexFile);

    if (!indexExists) {
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

    // Analyze the index file
    await this.analyzeIndexFile(analysis);

    // Calculate tree-shaking score
    analysis.treeShakingScore = this.calculateTreeShakingScore(analysis);

    return analysis;
  }

  private async analyzeIndexFile(analysis: PackageAnalysis): Promise<void> {
    try {
      // Read the index file content
      const content = this.fileSystemService.readFileSync(analysis.indexFile, "utf8");

      // Count export statements using simple regex
      const exportLines = content
        .split("\n")
        .filter(
          (line) => line.trim().startsWith("export ") && !line.trim().startsWith("export type"),
        );

      const typeExportLines = content
        .split("\n")
        .filter((line) => line.trim().startsWith("export type"));

      analysis.exportCount = exportLines.length + typeExportLines.length;

      // Analyze export patterns
      for (const [index, line] of exportLines.entries()) {
        await this.analyzeExportLine(analysis, line, index + 1);
      }

      // Check for large barrel exports
      if (analysis.exportCount > 50) {
        analysis.issues.push({
          description: `Large barrel export with ${analysis.exportCount} exports`,
          file: analysis.indexFile,
          recommendation:
            "Consider splitting into smaller, focused exports or providing selective entry points",
          severity: "critical",
          type: "large-barrel",
        });
      } else if (analysis.exportCount > 20) {
        analysis.issues.push({
          description: `Medium-sized barrel export with ${analysis.exportCount} exports`,
          file: analysis.indexFile,
          recommendation:
            "Consider organizing exports by feature or providing selective entry points",
          severity: "high",
          type: "large-barrel",
        });
      }
    } catch (error) {
      analysis.issues.push({
        description: `Error analyzing file: ${String(error)}`,
        file: analysis.indexFile,
        recommendation: "Check file syntax and structure",
        severity: "medium",
        type: "unused-export",
      });
    }
  }

  private async analyzeExportLine(
    analysis: PackageAnalysis,
    line: string,
    lineNumber: number,
  ): Promise<void> {
    // Extract module specifier from export statement
    const fromMatch = /from\s+["']([^"']+)["']/.exec(line);

    if (!fromMatch) {
      return;
    }

    const moduleSpecifier = fromMatch[1];

    // Check for wildcard exports
    if (line.includes("export *")) {
      analysis.issues.push({
        description: `Wildcard export from "${moduleSpecifier}" prevents tree-shaking`,
        file: analysis.indexFile,
        line: lineNumber,
        recommendation: "Use named exports instead of wildcard exports for better tree-shaking",
        severity: "high",
        type: "wildcard-export",
      });
    }

    // Check re-export depth for relative imports
    if (moduleSpecifier.startsWith("./") || moduleSpecifier.startsWith("../")) {
      const reexportPath = this.pathService.resolve(
        this.pathService.dirname(analysis.indexFile),
        moduleSpecifier,
      );

      const depth = await this.calculateReexportDepth(reexportPath, 1);

      analysis.reexportDepth = Math.max(analysis.reexportDepth, depth);

      if (depth > 3) {
        analysis.issues.push({
          description: `Deep re-export chain (depth: ${depth}) from "${moduleSpecifier}"`,
          file: analysis.indexFile,
          line: lineNumber,
          recommendation: "Consider flattening the export structure to reduce re-export depth",
          severity: "medium",
          type: "deep-reexport",
        });
      }
    }
  }

  private async calculateReexportDepth(filePath: string, currentDepth: number): Promise<number> {
    if (currentDepth > 5) return currentDepth; // Prevent infinite recursion

    const indexPath = filePath.endsWith(".ts") ? filePath : `${filePath}/index.ts`;
    const exists = this.fileSystemService.existsSync(indexPath);

    if (!exists) {
      return currentDepth;
    }

    try {
      const content = this.fileSystemService.readFileSync(indexPath, "utf8");
      const exportLines = content
        .split("\n")
        .filter((line) => line.trim().startsWith("export ") && line.includes("from"));

      let maxDepth = currentDepth;

      for (const line of exportLines) {
        const fromMatch = /from\s+["']([^"']+)["']/.exec(line);

        if (fromMatch) {
          const moduleSpecifier = fromMatch[1];

          if (moduleSpecifier.startsWith("./") || moduleSpecifier.startsWith("../")) {
            const nextPath = this.pathService.resolve(
              this.pathService.dirname(indexPath),
              moduleSpecifier,
            );
            const depth = await this.calculateReexportDepth(nextPath, currentDepth + 1);

            maxDepth = Math.max(maxDepth, depth);
          }
        }
      }

      return maxDepth;
    } catch {
      return currentDepth;
    }
  }

  private calculateTreeShakingScore(analysis: PackageAnalysis): number {
    let score = 100;

    // Deduct points for issues
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

    // Additional deductions for metrics
    if (analysis.exportCount > 100) score -= 20;
    else if (analysis.exportCount > 50) score -= 10;
    else if (analysis.exportCount > 20) score -= 5;

    if (analysis.reexportDepth > 4) score -= 15;
    else if (analysis.reexportDepth > 3) score -= 10;
    else if (analysis.reexportDepth > 2) score -= 5;

    return Math.max(0, score);
  }

  private displaySummary(analyses: PackageAnalysis[]): void {
    this.loggingService.info("\n📊 Tree-Shaking Analysis Summary:");
    this.loggingService.info("=".repeat(50));

    const totalIssues = analyses.reduce((sum, analysis) => sum + analysis.issues.length, 0);
    const avgScore =
      analyses.reduce((sum, analysis) => sum + analysis.treeShakingScore, 0) / analyses.length;

    this.loggingService.info(`Total packages analyzed: ${analyses.length}`);
    this.loggingService.info(`Total issues found: ${totalIssues}`);
    this.loggingService.info(`Average tree-shaking score: ${avgScore.toFixed(1)}/100`);

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

    if (criticalIssues.length > 0) {
      this.loggingService.error(`🚨 Critical issues: ${criticalIssues.length}`);
    }

    if (highIssues.length > 0) {
      this.loggingService.warning(`⚠️  High priority issues: ${highIssues.length}`);
    }

    if (mediumIssues.length > 0) {
      this.loggingService.info(`📋 Medium priority issues: ${mediumIssues.length}`);
    }

    if (lowIssues.length > 0) {
      this.loggingService.info(`📝 Low priority issues: ${lowIssues.length}`);
    }

    // Show worst packages
    const worstPackages = analyses
      .filter((a) => a.treeShakingScore < 80)
      .sort((a, b) => a.treeShakingScore - b.treeShakingScore)
      .slice(0, 5);

    if (worstPackages.length > 0) {
      this.loggingService.warning("\n🎯 Packages needing attention:");
      for (const pkg of worstPackages) {
        this.loggingService.warning(
          `  ${pkg.packageName}: ${pkg.treeShakingScore}/100 (${pkg.issues.length} issues)`,
        );
      }
    }

    // Show the best packages
    const bestPackages = analyses
      .filter((a) => a.treeShakingScore >= 90)
      .sort((a, b) => b.treeShakingScore - a.treeShakingScore)
      .slice(0, 3);

    if (bestPackages.length > 0) {
      this.loggingService.success("\n✅ Well-optimized packages:");
      for (const pkg of bestPackages) {
        this.loggingService.success(`  ${pkg.packageName}: ${pkg.treeShakingScore}/100`);
      }
    }
  }
}
