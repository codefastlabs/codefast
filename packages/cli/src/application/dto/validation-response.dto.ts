import type { ValidationResult } from "../../domain/component-validation/entities/validation-result";

export interface ValidationResponseDto {
  executionTimeMs: number;
  formattedOutput: string;
  invalidComponents: number;
  success: boolean;
  totalComponents: number;
  totalErrors: number;
  totalWarnings: number;
  validComponents: number;
}

export class ValidationResponse {
  constructor(
    public readonly success: boolean,
    public readonly totalComponents: number,
    public readonly validComponents: number,
    public readonly invalidComponents: number,
    public readonly totalErrors: number,
    public readonly totalWarnings: number,
    public readonly formattedOutput: string,
    public readonly executionTimeMs: number,
  ) {}

  static fromValidationResult(
    result: ValidationResult,
    formattedOutput: string,
    executionTimeMs: number,
  ): ValidationResponse {
    const summary = result.getSummary();

    return new ValidationResponse(
      summary.isAllValid,
      summary.totalComponents,
      summary.validComponents,
      summary.invalidComponents,
      summary.totalErrors,
      summary.totalWarnings,
      formattedOutput,
      executionTimeMs,
    );
  }

  toDto(): ValidationResponseDto {
    return {
      executionTimeMs: this.executionTimeMs,
      formattedOutput: this.formattedOutput,
      invalidComponents: this.invalidComponents,
      success: this.success,
      totalComponents: this.totalComponents,
      totalErrors: this.totalErrors,
      totalWarnings: this.totalWarnings,
      validComponents: this.validComponents,
    };
  }

  getExitCode(): number {
    return this.success ? 0 : 1;
  }
}
