import type { ValidationError } from "../../shared/types";
import type { Component } from "./component";

export interface ComponentValidationResult {
  component: Component;
  errorCount: number;
  errors: ValidationError[];
  isValid: boolean;
  warningCount: number;
}

export class ValidationResult {
  constructor(private readonly _results: ComponentValidationResult[]) {}

  static create(components: Component[]): ValidationResult {
    const results: ComponentValidationResult[] = components.map((component) => {
      const summary = component.getValidationSummary();

      return {
        component,
        errorCount: summary.errorCount,
        errors: summary.errors,
        isValid: summary.isValid,
        warningCount: summary.warningCount,
      };
    });

    return new ValidationResult(results);
  }

  get results(): ComponentValidationResult[] {
    return [...this._results];
  }

  get totalComponents(): number {
    return this._results.length;
  }

  get validComponents(): ComponentValidationResult[] {
    return this._results.filter((result) => result.isValid);
  }

  get invalidComponents(): ComponentValidationResult[] {
    return this._results.filter((result) => !result.isValid);
  }

  get componentsWithWarnings(): ComponentValidationResult[] {
    return this._results.filter((result) => result.warningCount > 0);
  }

  get totalErrors(): number {
    return this._results.reduce((sum, result) => sum + result.errorCount, 0);
  }

  get totalWarnings(): number {
    return this._results.reduce((sum, result) => sum + result.warningCount, 0);
  }

  get isAllValid(): boolean {
    return this.totalErrors === 0;
  }

  get hasWarnings(): boolean {
    return this.totalWarnings > 0;
  }

  getErrorsByCode(): Map<string, ValidationError[]> {
    const errorsByCode = new Map<string, ValidationError[]>();

    for (const result of this._results) {
      for (const error of result.errors) {
        if (!errorsByCode.has(error.code)) {
          errorsByCode.set(error.code, []);
        }

        errorsByCode.get(error.code)!.push(error);
      }
    }

    return errorsByCode;
  }

  getSummary(): {
    totalComponents: number;
    validComponents: number;
    invalidComponents: number;
    totalErrors: number;
    totalWarnings: number;
    isAllValid: boolean;
    hasWarnings: boolean;
  } {
    return {
      hasWarnings: this.hasWarnings,
      invalidComponents: this.invalidComponents.length,
      isAllValid: this.isAllValid,
      totalComponents: this.totalComponents,
      totalErrors: this.totalErrors,
      totalWarnings: this.totalWarnings,
      validComponents: this.validComponents.length,
    };
  }

  getDetailedReport(): string {
    const summary = this.getSummary();
    let report = `\nValidation Summary:\n`;

    report += `Total Components: ${summary.totalComponents}\n`;
    report += `Valid Components: ${summary.validComponents}\n`;
    report += `Invalid Components: ${summary.invalidComponents}\n`;
    report += `Total Errors: ${summary.totalErrors}\n`;
    report += `Total Warnings: ${summary.totalWarnings}\n`;

    if (summary.invalidComponents > 0) {
      report += `\nComponents with errors:\n`;

      for (const result of this.invalidComponents) {
        report += `  ${result.component.path.value}:\n`;

        for (const error of result.errors) {
          const icon = error.severity === "error" ? "❌" : "⚠️";

          report += `    ${icon} ${error.message} (${error.code})\n`;
        }
      }
    }

    return report;
  }
}
