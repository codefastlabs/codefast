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
    const componentsWithWarnings = result.componentsWithWarnings;

    // If no errors and no warnings, show success message
    if (invalidComponents.length === 0 && componentsWithWarnings.length === 0) {
      return chalk.green("\n✅ All components are valid with no issues!\n");
    }

    let output = "";

    // Show components with errors first
    if (invalidComponents.length > 0) {
      output += "\n" + chalk.bold.red("Components with errors:") + "\n\n";

      for (const componentResult of invalidComponents) {
        const relativePath = this.getRelativePath(componentResult.component.path.value);
        const errors = componentResult.errors.filter(e => e.severity === "error");
        const warnings = componentResult.errors.filter(e => e.severity === "warning");

        output += chalk.bold(`📁 ${relativePath}`) + "\n";

        // Show errors first
        for (const error of errors) {
          output += `  ❌ ${chalk.red(error.message)} ${chalk.gray(`(${error.code})`)}\n`;
        }

        // Show warnings for this component if any
        for (const warning of warnings) {
          output += `  ⚠️  ${chalk.yellow(warning.message)} ${chalk.gray(`(${warning.code})`)}\n`;
        }

        output += "\n";
      }
    }

    // Show components with only warnings (valid components with warnings)
    const validComponentsWithWarnings = componentsWithWarnings.filter(c => c.isValid);
    if (validComponentsWithWarnings.length > 0) {
      output += "\n" + chalk.bold.yellow("Components with warnings:") + "\n\n";

      for (const componentResult of validComponentsWithWarnings) {
        const relativePath = this.getRelativePath(componentResult.component.path.value);
        const warnings = componentResult.errors.filter(e => e.severity === "warning");

        output += chalk.bold(`📁 ${relativePath}`) + "\n";

        for (const warning of warnings) {
          output += `  ⚠️  ${chalk.yellow(warning.message)} ${chalk.gray(`(${warning.code})`)}\n`;
        }

        output += "\n";
      }
    }

    // If only warnings exist, show a different success message
    if (invalidComponents.length === 0 && componentsWithWarnings.length > 0) {
      output = chalk.green("\n✅ All components are valid!") + output;
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
    const invalidComponents = result.invalidComponents;
    const componentsWithWarnings = result.componentsWithWarnings;

    let output = "Component Validation Results\n";
    output += "============================\n\n";

    output += `Total Components: ${summary.totalComponents}\n`;
    output += `Valid Components: ${summary.validComponents}\n`;
    output += `Invalid Components: ${summary.invalidComponents}\n`;
    output += `Components with Warnings: ${componentsWithWarnings.length}\n`;
    output += `Total Errors: ${summary.totalErrors}\n`;
    output += `Total Warnings: ${summary.totalWarnings}\n\n`;

    // Show components with errors
    if (invalidComponents.length > 0) {
      output += "Components with errors:\n";
      output += "-----------------------\n\n";

      for (const componentResult of invalidComponents) {
        const relativePath = this.getRelativePath(componentResult.component.path.value);
        const errors = componentResult.errors.filter(e => e.severity === "error");
        const warnings = componentResult.errors.filter(e => e.severity === "warning");

        output += `File: ${relativePath}\n`;

        // Show errors first
        for (const error of errors) {
          output += `  [ERROR] ${error.message} (${error.code})\n`;
        }

        // Show warnings for this component if any
        for (const warning of warnings) {
          output += `  [WARNING] ${warning.message} (${warning.code})\n`;
        }

        output += "\n";
      }
    }

    // Show components with only warnings (valid components with warnings)
    const validComponentsWithWarnings = componentsWithWarnings.filter(c => c.isValid);
    if (validComponentsWithWarnings.length > 0) {
      output += "Components with warnings:\n";
      output += "-------------------------\n\n";

      for (const componentResult of validComponentsWithWarnings) {
        const relativePath = this.getRelativePath(componentResult.component.path.value);
        const warnings = componentResult.errors.filter(e => e.severity === "warning");

        output += `File: ${relativePath}\n`;

        for (const warning of warnings) {
          output += `  [WARNING] ${warning.message} (${warning.code})\n`;
        }

        output += "\n";
      }
    }

    // Add final status message
    if (invalidComponents.length === 0 && componentsWithWarnings.length === 0) {
      output += "Status: All components are valid with no issues!\n";
    } else if (invalidComponents.length === 0) {
      output += "Status: All components are valid (with warnings)\n";
    } else {
      output += "Status: Some components have errors that need to be fixed\n";
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
