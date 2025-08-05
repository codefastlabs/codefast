import { Command } from "commander";

import { ValidationRequest } from "../../../application/dto/validation-request.dto";
import { ValidateComponentsUseCase } from "../../../application/use-cases/validate-components.use-case";
import { container } from "../../di/container";

export function createValidateComponentsCommand(): Command {
  const command = new Command("validate-components");

  command
    .description("Validate React components for proper export patterns")
    .option("-p, --path <path>", "Target directory to scan", process.cwd())
    .option("--pattern <pattern>", "File pattern to match", "**/*.tsx")
    .option("--no-warnings", "Hide warnings, show only errors")
    .option("-f, --format <format>", "Output format (table, json, junit, text)", "table")
    .option("--fix", "Auto-fix violations where possible", false)
    .action(async (options) => {
      try {
        // Create validation request from CLI options
        const request = ValidationRequest.fromCliArgs({
          fix: options.fix,
          format: options.format,
          includeWarnings: options.warnings,
          path: options.path,
          pattern: options.pattern,
        });

        // Get use case from DI container
        const useCase = container.get<ValidateComponentsUseCase>(ValidateComponentsUseCase);

        // Execute validation
        const response = await useCase.execute(request);

        // Output results
        console.log(response.formattedOutput);

        // Show execution time
        if (response.executionTimeMs > 0) {
          console.log(`\nCompleted in ${response.executionTimeMs}ms`);
        }

        // Exit with appropriate code
        process.exit(response.getExitCode());
      } catch (error) {
        console.error("Error:", error instanceof Error ? error.message : "Unknown error occurred");
        process.exit(1);
      }
    });

  return command;
}
