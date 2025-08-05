import type { ValidationResult } from "../../domain/component-validation/entities/validation-result";

export type OutputFormat = "json" | "junit" | "table" | "text";

export interface OutputFormatterPort {
  format: (result: ValidationResult, format: OutputFormat) => string;
  formatErrors: (result: ValidationResult) => string;
  formatSummary: (result: ValidationResult) => string;
}
