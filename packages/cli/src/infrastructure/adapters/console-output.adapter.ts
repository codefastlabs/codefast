import chalk from "chalk";
import { injectable } from "inversify";

import type {
  OutputFormatterPort,
  OutputFormat,
} from "../../application/ports/output-formatter.port";
import type { ValidationResult } from "../../domain/component-validation/entities/validation-result";

@injectable()
export class ConsoleOutputAdapter implements OutputFormatterPort {
  format(result: ValidationResult, format: OutputFormat): string {
    switch (format) {
      case "table": {
        return this.formatAsTable(result);
      }

      case "json": {
        return this.formatAsJson(result);
      }

      case "junit": {
        return this.formatAsJunit(result);
      }

      case "text": {
        return this.formatAsText(result);
      }

      default: {
        return this.formatAsTable(result);
      }
    }
  }

  formatSummary(result: ValidationResult): string {
    const summary = result.getSummary();
    let output = "\n" + chalk.bold("Validation Summary:") + "\n";

    output += `${chalk.blue("Total Components:")} ${summary.totalComponents}\n`;
    output += `${chalk.green("Valid Components:")} ${summary.validComponents}\n`;

    if (summary.invalidComponents > 0) {
      output += `${chalk.red("Invalid Components:")} ${summary.invalidComponents}\n`;
    }

    if (summary.totalErrors > 0) {
      output += `${chalk.red("Total Errors:")} ${summary.totalErrors}\n`;
    }

    if (summary.totalWarnings > 0) {
      output += `${chalk.yellow("Total Warnings:")} ${summary.totalWarnings}\n`;
    }

    return output;
  }

  formatErrors(result: ValidationResult): string {
    const invalidComponents = result.invalidComponents;

    if (invalidComponents.length === 0) {
      return chalk.green("\n✅ All components are valid!\n");
    }

    let output = "\n" + chalk.bold.red("Components with issues:") + "\n\n";

    for (const componentResult of invalidComponents) {
      const relativePath = this.getRelativePath(componentResult.component.path.value);

      output += chalk.bold(`📁 ${relativePath}`) + "\n";

      for (const error of componentResult.errors) {
        const icon = error.severity === "error" ? "❌" : "⚠️";
        const color = error.severity === "error" ? chalk.red : chalk.yellow;

        output += `  ${icon} ${color(error.message)} ${chalk.gray(`(${error.code})`)}\n`;
      }

      output += "\n";
    }

    return output;
  }

  private formatAsTable(result: ValidationResult): string {
    let output = this.formatSummary(result);

    output += this.formatErrors(result);

    return output;
  }

  private formatAsJson(result: ValidationResult): string {
    const summary = result.getSummary();
    const jsonOutput = {
      components: result.results.map((componentResult) => ({
        errorCount: componentResult.errorCount,
        errors: componentResult.errors,
        exports: {
          components: componentResult.component.exportPattern.componentExports,
          interfaces: componentResult.component.exportPattern.interfaceExports,
          summary: componentResult.component.exportPattern.getExportSummary(),
        },
        isValid: componentResult.isValid,
        path: componentResult.component.path.value,
        warningCount: componentResult.warningCount,
      })),
      summary,
    };

    return JSON.stringify(jsonOutput, null, 2);
  }

  private formatAsJunit(result: ValidationResult): string {
    const summary = result.getSummary();
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';

    xml += `<testsuite name="Component Validation" tests="${summary.totalComponents}" failures="${summary.invalidComponents}" errors="0" time="0">\n`;

    for (const componentResult of result.results) {
      const relativePath = this.getRelativePath(componentResult.component.path.value);

      xml += `  <testcase classname="ComponentValidation" name="${relativePath}"`;

      if (componentResult.isValid) {
        xml += " />\n";
      } else {
        xml += ">\n";

        for (const error of componentResult.errors) {
          xml += `    <failure message="${this.escapeXml(error.message)}" type="${error.code}">${this.escapeXml(error.message)}</failure>\n`;
        }

        xml += "  </testcase>\n";
      }
    }

    xml += "</testsuite>\n";

    return xml;
  }

  private formatAsText(result: ValidationResult): string {
    const summary = result.getSummary();
    let output = "Component Validation Results\n";

    output += "============================\n\n";

    output += `Total Components: ${summary.totalComponents}\n`;
    output += `Valid Components: ${summary.validComponents}\n`;
    output += `Invalid Components: ${summary.invalidComponents}\n`;
    output += `Total Errors: ${summary.totalErrors}\n`;
    output += `Total Warnings: ${summary.totalWarnings}\n\n`;

    if (summary.invalidComponents > 0) {
      output += "Components with issues:\n";
      output += "-----------------------\n\n";

      for (const componentResult of result.invalidComponents) {
        const relativePath = this.getRelativePath(componentResult.component.path.value);

        output += `File: ${relativePath}\n`;

        for (const error of componentResult.errors) {
          const severity = error.severity.toUpperCase();

          output += `  [${severity}] ${error.message} (${error.code})\n`;
        }

        output += "\n";
      }
    }

    return output;
  }

  private getRelativePath(absolutePath: string): string {
    const cwd = process.cwd();

    return absolutePath.startsWith(cwd)
      ? absolutePath.slice(Math.max(0, cwd.length + 1))
      : absolutePath;
  }

  private escapeXml(text: string): string {
    return text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&apos;");
  }
}
