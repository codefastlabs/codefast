/**
 * ProjectStatistics Value Object
 *
 * Domain value object representing project analysis statistics.
 * Immutable and contains validation and business rules for statistics.
 */

export class ProjectStatistics {
  private readonly _totalFiles: number;
  private readonly _totalClasses: number;
  private readonly _totalFunctions: number;
  private readonly _totalInterfaces: number;

  constructor(
    totalFiles: number,
    totalClasses: number,
    totalFunctions: number,
    totalInterfaces: number
  ) {
    if (totalFiles < 0) {
      throw new Error("Total files cannot be negative");
    }

    if (totalClasses < 0) {
      throw new Error("Total classes cannot be negative");
    }

    if (totalFunctions < 0) {
      throw new Error("Total functions cannot be negative");
    }

    if (totalInterfaces < 0) {
      throw new Error("Total interfaces cannot be negative");
    }

    this._totalFiles = totalFiles;
    this._totalClasses = totalClasses;
    this._totalFunctions = totalFunctions;
    this._totalInterfaces = totalInterfaces;
  }

  get totalFiles(): number {
    return this._totalFiles;
  }

  get totalClasses(): number {
    return this._totalClasses;
  }

  get totalFunctions(): number {
    return this._totalFunctions;
  }

  get totalInterfaces(): number {
    return this._totalInterfaces;
  }

  get totalSymbols(): number {
    return this._totalClasses + this._totalFunctions + this._totalInterfaces;
  }

  get averageSymbolsPerFile(): number {
    return this._totalFiles === 0 ? 0 : this.totalSymbols / this._totalFiles;
  }

  isEmpty(): boolean {
    return this._totalFiles === 0;
  }

  hasClasses(): boolean {
    return this._totalClasses > 0;
  }

  hasFunctions(): boolean {
    return this._totalFunctions > 0;
  }

  hasInterfaces(): boolean {
    return this._totalInterfaces > 0;
  }

  equals(other: ProjectStatistics): boolean {
    return (
      this._totalFiles === other._totalFiles &&
      this._totalClasses === other._totalClasses &&
      this._totalFunctions === other._totalFunctions &&
      this._totalInterfaces === other._totalInterfaces
    );
  }

  toString(): string {
    return `ProjectStatistics(files: ${this._totalFiles}, classes: ${this._totalClasses}, functions: ${this._totalFunctions}, interfaces: ${this._totalInterfaces})`;
  }

  toPlainObject(): {
    totalFiles: number;
    totalClasses: number;
    totalFunctions: number;
    totalInterfaces: number;
  } {
    return {
      totalClasses: this._totalClasses,
      totalFiles: this._totalFiles,
      totalFunctions: this._totalFunctions,
      totalInterfaces: this._totalInterfaces,
    };
  }
}
