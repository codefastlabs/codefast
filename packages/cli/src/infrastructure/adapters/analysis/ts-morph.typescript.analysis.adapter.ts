/**
 * ts-morph TypeScript Analysis Service Adapter
 *
 * Infrastructure implementation of the TypeScript analysis service using ts-morph.
 * Following explicit architecture guidelines for CLI applications.
 */

import { injectable } from "inversify";
import { Project } from "ts-morph";

import type { TypeScriptAnalysisPort } from "@/application/ports/analysis/typescript.analysis.port";

@injectable()
export class TsMorphTypescriptAnalysisAdapter implements TypeScriptAnalysisPort {
  private project: null | Project = null;

  createProject(tsConfigPath?: string): void {
    this.project = new Project({
      tsConfigFilePath: tsConfigPath,
    });
  }

  addSourceFiles(filePaths: string[]): void {
    if (!this.project) {
      throw new Error("Project not initialized. Call createProject() first.");
    }

    this.project.addSourceFilesAtPaths(filePaths);
  }

  getProjectStatistics(): {
    totalFiles: number;
    totalClasses: number;
    totalFunctions: number;
    totalInterfaces: number;
  } {
    if (!this.project) {
      throw new Error("Project not initialized. Call createProject() first.");
    }

    const sourceFiles = this.project.getSourceFiles();

    let totalClasses = 0;
    let totalFunctions = 0;
    let totalInterfaces = 0;

    for (const sourceFile of sourceFiles) {
      totalClasses += sourceFile.getClasses().length;
      totalFunctions += sourceFile.getFunctions().length;
      totalInterfaces += sourceFile.getInterfaces().length;
    }

    return {
      totalClasses,
      totalFiles: sourceFiles.length,
      totalFunctions,
      totalInterfaces,
    };
  }

  reset(): void {
    this.project = null;
  }
}
