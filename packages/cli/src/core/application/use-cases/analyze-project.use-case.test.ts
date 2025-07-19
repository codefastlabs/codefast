/**
 * Tests for Analyze Project Use Case
 */

import type { FileSystemService } from "@/core/application/ports/file-system.port";
import type { LoggingService } from "@/core/application/ports/logging.port";
import type { TypeScriptAnalysisService } from "@/core/application/ports/typescript-analysis.port";

import { AnalyzeProjectUseCase } from "./analyze-project.use-case";

describe("AnalyzeProjectUseCase", () => {
  let useCase: AnalyzeProjectUseCase;
  let mockLoggingService: jest.Mocked<LoggingService>;
  let mockFileSystemService: jest.Mocked<FileSystemService>;
  let mockAnalysisService: jest.Mocked<TypeScriptAnalysisService>;

  beforeEach(() => {
    // Create mock services
    mockLoggingService = {
      error: jest.fn(),
      info: jest.fn(),
      success: jest.fn(),
      warning: jest.fn(),
    };

    mockFileSystemService = {
      findFiles: jest.fn(),
    };

    mockAnalysisService = {
      addSourceFiles: jest.fn(),
      createProject: jest.fn(),
      getProjectStatistics: jest.fn(),
      reset: jest.fn(),
    };

    // Create use case instance with mocked dependencies
    useCase = new AnalyzeProjectUseCase(
      mockLoggingService,
      mockFileSystemService,
      mockAnalysisService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("execute", () => {
    it("should analyze project with default pattern when no input provided", async () => {
      // Arrange
      const mockFiles = ["src/file1.ts", "src/file2.ts"];
      const mockStats = {
        totalClasses: 3,
        totalFiles: 2,
        totalFunctions: 5,
        totalInterfaces: 2,
      };

      mockFileSystemService.findFiles.mockResolvedValue(mockFiles);
      mockAnalysisService.getProjectStatistics.mockReturnValue(mockStats);

      // Act
      await useCase.execute();

      // Assert
      expect(mockFileSystemService.findFiles).toHaveBeenCalledWith("src/**/*.ts");
      expect(mockLoggingService.info).toHaveBeenCalledWith("🔍 Analyzing TypeScript project...");
      expect(mockLoggingService.success).toHaveBeenCalledWith("Found 2 TypeScript files");
      expect(mockAnalysisService.createProject).toHaveBeenCalledWith(undefined);
      expect(mockAnalysisService.addSourceFiles).toHaveBeenCalledWith(mockFiles);
      expect(mockAnalysisService.reset).toHaveBeenCalled();
    });

    it("should analyze project with custom pattern and tsconfig path", async () => {
      // Arrange
      const input = { pattern: "lib/**/*.ts", tsConfigPath: "./custom-tsconfig.json" };
      const mockFiles = ["lib/file1.ts"];
      const mockStats = {
        totalClasses: 1,
        totalFiles: 1,
        totalFunctions: 2,
        totalInterfaces: 1,
      };

      mockFileSystemService.findFiles.mockResolvedValue(mockFiles);
      mockAnalysisService.getProjectStatistics.mockReturnValue(mockStats);

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockFileSystemService.findFiles).toHaveBeenCalledWith("lib/**/*.ts");
      expect(mockAnalysisService.createProject).toHaveBeenCalledWith("./custom-tsconfig.json");
      expect(mockAnalysisService.addSourceFiles).toHaveBeenCalledWith(mockFiles);
    });

    it("should handle case when no files are found", async () => {
      // Arrange
      mockFileSystemService.findFiles.mockResolvedValue([]);

      // Act
      await useCase.execute();

      // Assert
      expect(mockLoggingService.success).toHaveBeenCalledWith("Found 0 TypeScript files");
      expect(mockLoggingService.warning).toHaveBeenCalledWith(
        "No TypeScript files found to analyze",
      );
      expect(mockAnalysisService.createProject).not.toHaveBeenCalled();
      expect(mockAnalysisService.addSourceFiles).not.toHaveBeenCalled();
      expect(mockAnalysisService.getProjectStatistics).not.toHaveBeenCalled();
      expect(mockAnalysisService.reset).not.toHaveBeenCalled();
    });

    it("should display project statistics correctly", async () => {
      // Arrange
      const mockFiles = ["src/file1.ts"];
      const mockStats = {
        totalClasses: 5,
        totalFiles: 1,
        totalFunctions: 10,
        totalInterfaces: 3,
      };

      mockFileSystemService.findFiles.mockResolvedValue(mockFiles);
      mockAnalysisService.getProjectStatistics.mockReturnValue(mockStats);

      // Act
      await useCase.execute();

      // Assert
      expect(mockLoggingService.warning).toHaveBeenCalledWith("Loaded 1 source files for analysis");
      expect(mockLoggingService.info).toHaveBeenCalledWith("📊 Project Statistics:");
      expect(mockLoggingService.info).toHaveBeenCalledWith("  Classes: 5");
      expect(mockLoggingService.info).toHaveBeenCalledWith("  Functions: 10");
      expect(mockLoggingService.info).toHaveBeenCalledWith("  Interfaces: 3");
    });

    it("should handle analysis errors gracefully", async () => {
      // Arrange
      const mockFiles = ["src/file1.ts"];
      const error = new Error("Analysis failed");

      mockFileSystemService.findFiles.mockResolvedValue(mockFiles);
      mockAnalysisService.createProject.mockImplementation(() => {
        throw error;
      });

      // Act
      await useCase.execute();

      // Assert
      expect(mockLoggingService.error).toHaveBeenCalledWith(
        "Error analyzing project: Error: Analysis failed",
      );
      expect(mockAnalysisService.reset).toHaveBeenCalled(); // Should still clean up
    });

    it("should handle file system errors", async () => {
      // Arrange
      const error = new Error("File system error");

      mockFileSystemService.findFiles.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow("File system error");
      expect(mockAnalysisService.reset).not.toHaveBeenCalled();
    });

    it("should always call reset in finally block", async () => {
      // Arrange
      const mockFiles = ["src/file1.ts"];
      const mockStats = {
        totalClasses: 1,
        totalFiles: 1,
        totalFunctions: 1,
        totalInterfaces: 1,
      };

      mockFileSystemService.findFiles.mockResolvedValue(mockFiles);
      mockAnalysisService.getProjectStatistics.mockReturnValue(mockStats);

      // Act
      await useCase.execute();

      // Assert
      expect(mockAnalysisService.reset).toHaveBeenCalled();
    });

    it("should call reset even when analysis throws error", async () => {
      // Arrange
      const mockFiles = ["src/file1.ts"];

      mockFileSystemService.findFiles.mockResolvedValue(mockFiles);
      mockAnalysisService.addSourceFiles.mockImplementation(() => {
        throw new Error("Add files failed");
      });

      // Act
      await useCase.execute();

      // Assert
      expect(mockAnalysisService.reset).toHaveBeenCalled();
      expect(mockLoggingService.error).toHaveBeenCalledWith(
        "Error analyzing project: Error: Add files failed",
      );
    });
  });
});
