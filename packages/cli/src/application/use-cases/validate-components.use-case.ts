import { injectable, inject } from "inversify";

import type { FileSystemPort } from "../ports/file-system.port";
import type { OutputFormatterPort } from "../ports/output-formatter.port";
import type { TypeScriptParserPort } from "../ports/typescript-parser.port";

import { Component } from "../../domain/component-validation/entities/component";
import { ValidationResult } from "../../domain/component-validation/entities/validation-result";
import { ExportPattern } from "../../domain/component-validation/value-objects/export-pattern";
import { ValidationRequest } from "../dto/validation-request.dto";
import { ValidationResponse } from "../dto/validation-response.dto";

export const TYPES = {
  FileSystemPort: Symbol.for("FileSystemPort"),
  OutputFormatterPort: Symbol.for("OutputFormatterPort"),
  TypeScriptParserPort: Symbol.for("TypeScriptParserPort"),
};

@injectable()
export class ValidateComponentsUseCase {
  constructor(
    @inject(TYPES.FileSystemPort) private readonly fileSystem: FileSystemPort,
    @inject(TYPES.TypeScriptParserPort) private readonly parser: TypeScriptParserPort,
    @inject(TYPES.OutputFormatterPort) private readonly formatter: OutputFormatterPort,
  ) {}

  async execute(request: ValidationRequest): Promise<ValidationResponse> {
    const startTime = Date.now();

    try {
      // 1. Validate input path
      const absolutePath = this.fileSystem.getAbsolutePath(request.path);
      const pathExists = await this.fileSystem.fileExists(absolutePath);

      if (!pathExists) {
        throw new Error(`Path does not exist: ${absolutePath}`);
      }

      // 2. Find component files
      const componentFiles = await this.fileSystem.findFiles(absolutePath, request.pattern);

      if (componentFiles.length === 0) {
        const executionTime = Date.now() - startTime;
        const emptyResult = ValidationResult.create([]);
        const formattedOutput = this.formatter.format(emptyResult, request.outputFormat);

        return ValidationResponse.fromValidationResult(emptyResult, formattedOutput, executionTime);
      }

      // 3. Parse each component file
      const components: Component[] = [];

      for (const filePath of componentFiles) {
        try {
          const parsedFile = await this.parser.parseFile(filePath);
          const exportPattern = ExportPattern.create(parsedFile.exports);
          const component = Component.create(filePath, exportPattern);

          components.push(component);
        } catch (error) {
          console.warn(`Warning: Failed to parse ${filePath}: ${error}`);
          // Continue processing other files
        }
      }

      // 4. Validate components
      const validationResult = ValidationResult.create(components);

      // 5. Format output
      const formattedOutput = this.formatter.format(validationResult, request.outputFormat);

      // 6. Calculate execution time
      const executionTime = Date.now() - startTime;

      // 7. Create response
      return ValidationResponse.fromValidationResult(
        validationResult,
        formattedOutput,
        executionTime,
      );
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

      return new ValidationResponse(false, 0, 0, 0, 1, 0, `Error: ${errorMessage}`, executionTime);
    }
  }
}
