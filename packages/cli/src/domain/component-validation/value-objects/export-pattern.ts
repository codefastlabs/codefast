import type { ExportInfo, ValidationError } from "../../shared/types";

export class ExportPattern {
  constructor(private readonly exports: ExportInfo[]) {}

  static create(exports: ExportInfo[]): ExportPattern {
    return new ExportPattern(exports);
  }

  get componentExports(): ExportInfo[] {
    return this.exports.filter((exp) => exp.isComponent);
  }

  get interfaceExports(): ExportInfo[] {
    return this.exports.filter((exp) => exp.isInterface || exp.isType);
  }

  get namedExports(): ExportInfo[] {
    return this.exports.filter((exp) => exp.type === "named");
  }

  get defaultExports(): ExportInfo[] {
    return this.exports.filter((exp) => exp.type === "default");
  }

  hasNamedComponentExport(): boolean {
    return this.componentExports.some((exp) => exp.type === "named");
  }

  hasNamedInterfaceExport(): boolean {
    return this.interfaceExports.some((exp) => exp.type === "named");
  }

  hasDefaultExports(): boolean {
    return this.defaultExports.length > 0;
  }

  validateComponentExportPattern(): ValidationError[] {
    const errors: ValidationError[] = [];

    // Rule 1: Components must have named exports
    if (!this.hasNamedComponentExport()) {
      errors.push({
        code: "MISSING_NAMED_COMPONENT_EXPORT",
        message: "React components must be exported using named exports",
        severity: "error",
      });
    }

    // Rule 2: Component interfaces/types should have named exports
    const componentNames = this.componentExports.map((exp) => exp.name);
    const hasMatchingInterface = componentNames.some((name) => {
      const interfaceName = `${name}Props`;

      return this.interfaceExports.some(
        (exp) => exp.name === interfaceName && exp.type === "named",
      );
    });

    if (this.componentExports.length > 0 && !hasMatchingInterface) {
      errors.push({
        code: "MISSING_NAMED_INTERFACE_EXPORT",
        message: "Component interfaces/types should be exported using named exports",
        severity: "warning",
      });
    }

    // Rule 3: Avoid default exports for components
    if (this.hasDefaultExports()) {
      errors.push({
        code: "DEFAULT_EXPORT_FOUND",
        message: "Avoid default exports for React components, use named exports instead",
        severity: "warning",
      });
    }

    return errors;
  }

  getExportSummary(): string {
    const componentCount = this.componentExports.length;
    const interfaceCount = this.interfaceExports.length;
    const namedCount = this.namedExports.length;
    const defaultCount = this.defaultExports.length;

    return `Components: ${componentCount}, Interfaces: ${interfaceCount}, Named: ${namedCount}, Default: ${defaultCount}`;
  }
}
