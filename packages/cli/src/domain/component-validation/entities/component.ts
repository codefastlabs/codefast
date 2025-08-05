import type { ValidationError } from "../../shared/types";
import type { ExportPattern } from "../value-objects/export-pattern";

import { ComponentPath } from "../value-objects/component-path";

export class Component {
  constructor(
    private readonly _path: ComponentPath,
    private readonly _exportPattern: ExportPattern,
  ) {}

  static create(path: string, exportPattern: ExportPattern): Component {
    const componentPath = ComponentPath.create(path);

    return new Component(componentPath, exportPattern);
  }

  get path(): ComponentPath {
    return this._path;
  }

  get exportPattern(): ExportPattern {
    return this._exportPattern;
  }

  get fileName(): string {
    return this._path.fileName;
  }

  get directory(): string {
    return this._path.directory;
  }

  get isReactComponent(): boolean {
    return this._path.isTypeScriptReact && this._exportPattern.componentExports.length > 0;
  }

  validate(): ValidationError[] {
    const errors: ValidationError[] = [];

    // Only validate React components (.tsx files with component exports)
    if (!this.isReactComponent) {
      return errors;
    }

    // Validate export patterns
    const exportErrors = this._exportPattern.validateComponentExportPattern();

    errors.push(...exportErrors);

    return errors;
  }

  hasValidationErrors(): boolean {
    return this.validate().some((error) => error.severity === "error");
  }

  hasValidationWarnings(): boolean {
    return this.validate().some((error) => error.severity === "warning");
  }

  getValidationSummary(): {
    isValid: boolean;
    errorCount: number;
    warningCount: number;
    errors: ValidationError[];
  } {
    const errors = this.validate();
    const errorCount = errors.filter((e) => e.severity === "error").length;
    const warningCount = errors.filter((e) => e.severity === "warning").length;

    return {
      errorCount,
      errors,
      isValid: errorCount === 0,
      warningCount,
    };
  }

  toString(): string {
    return `Component(${this._path.toString()})`;
  }

  equals(other: Component): boolean {
    return this._path.equals(other._path);
  }
}
