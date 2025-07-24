/**
 * Project Entity
 *
 * Domain entity representing a TypeScript project being analyzed.
 * Contains core business logic and rules for project analysis.
 */

import type { FilePath } from "../value-objects/file-path.value-object";
import type { ProjectStatistics } from "../value-objects/project-statistics.value-object";

export class Project {
  private readonly _id: string;
  private readonly _configPath?: string;

  constructor(id: string, configPath?: string) {
    if (!id.trim()) {
      throw new Error("Project ID cannot be empty");
    }

    this._id = id;
    this._configPath = configPath;
  }

  private _sourceFiles: FilePath[] = [];

  get sourceFiles(): FilePath[] {
    return [...this._sourceFiles];
  }

  private _statistics?: ProjectStatistics;

  get statistics(): ProjectStatistics | undefined {
    return this._statistics;
  }

  get id(): string {
    return this._id;
  }

  get configPath(): string | undefined {
    return this._configPath;
  }

  addSourceFiles(filePaths: FilePath[]): void {
    if (filePaths.length === 0) {
      throw new Error("Cannot add empty file paths");
    }

    this._sourceFiles.push(...filePaths);
  }

  updateStatistics(statistics: ProjectStatistics): void {
    this._statistics = statistics;
  }

  hasSourceFiles(): boolean {
    return this._sourceFiles.length > 0;
  }

  reset(): void {
    this._sourceFiles = [];
    this._statistics = undefined;
  }
}
