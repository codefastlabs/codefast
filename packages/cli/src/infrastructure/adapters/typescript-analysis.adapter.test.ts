/**
 * Tests for TypeScript Analysis Adapter
 */

import { Project, type SourceFile } from "ts-morph";

import { TsMorphAnalysisAdapter } from "./typescript-analysis.adapter";

// Mock ts-morph
jest.mock("ts-morph", () => ({
  Project: jest.fn().mockImplementation(() => ({
    addSourceFilesAtPaths: jest.fn(),
    getSourceFiles: jest.fn(),
  })),
}));

const MockProject = Project as jest.MockedClass<typeof Project>;

type MockSourceFile = Pick<SourceFile, "getClasses" | "getFunctions" | "getInterfaces"> & {
  getClasses: jest.MockedFunction<() => unknown[]>;
  getFunctions: jest.MockedFunction<() => unknown[]>;
  getInterfaces: jest.MockedFunction<() => unknown[]>;
};

describe("TsMorphAnalysisAdapter", () => {
  let adapter: TsMorphAnalysisAdapter;
  let mockProject: jest.Mocked<
    Pick<InstanceType<typeof Project>, "addSourceFilesAtPaths" | "getSourceFiles">
  >;

  beforeEach(() => {
    adapter = new TsMorphAnalysisAdapter();

    // Create a mock project instance
    mockProject = {
      addSourceFilesAtPaths: jest.fn(),
      getSourceFiles: jest.fn(),
    };

    // Make Project constructor return our mock
    MockProject.mockImplementation(() => mockProject as unknown as InstanceType<typeof Project>);

    jest.clearAllMocks();
  });

  describe("createProject", () => {
    it("should create project without tsconfig path", () => {
      // Act
      adapter.createProject();

      // Assert
      expect(MockProject).toHaveBeenCalledWith({
        tsConfigFilePath: undefined,
      });
    });

    it("should create project with custom tsconfig path", () => {
      // Arrange
      const tsConfigPath = "./custom-tsconfig.json";

      // Act
      adapter.createProject(tsConfigPath);

      // Assert
      expect(MockProject).toHaveBeenCalledWith({
        tsConfigFilePath: tsConfigPath,
      });
    });

    it("should replace existing project when called multiple times", () => {
      // Act
      adapter.createProject("./first-config.json");
      adapter.createProject("./second-config.json");

      // Assert
      expect(MockProject).toHaveBeenCalledTimes(2);
      expect(MockProject).toHaveBeenLastCalledWith({
        tsConfigFilePath: "./second-config.json",
      });
    });
  });

  describe("addSourceFiles", () => {
    it("should add source files when project is initialized", () => {
      // Arrange
      const filePaths = ["src/file1.ts", "src/file2.ts"];

      adapter.createProject();

      // Act
      adapter.addSourceFiles(filePaths);

      // Assert
      expect(mockProject.addSourceFilesAtPaths).toHaveBeenCalledWith(filePaths);
      expect(mockProject.addSourceFilesAtPaths).toHaveBeenCalledTimes(1);
    });

    it("should throw error when project is not initialized", () => {
      // Arrange
      const filePaths = ["src/file1.ts"];

      // Act & Assert
      expect(() => {
        adapter.addSourceFiles(filePaths);
      }).toThrow("Project not initialized. Call createProject() first.");
      expect(mockProject.addSourceFilesAtPaths).not.toHaveBeenCalled();
    });

    it("should handle empty file paths array", () => {
      // Arrange
      adapter.createProject();

      // Act
      adapter.addSourceFiles([]);

      // Assert
      expect(mockProject.addSourceFilesAtPaths).toHaveBeenCalledWith([]);
    });

    it("should throw error after reset", () => {
      // Arrange
      const filePaths = ["src/file1.ts"];

      adapter.createProject();
      adapter.reset();

      // Act & Assert
      expect(() => {
        adapter.addSourceFiles(filePaths);
      }).toThrow("Project not initialized. Call createProject() first.");
    });
  });

  describe("getProjectStatistics", () => {
    it("should return correct statistics when project has files", () => {
      // Arrange
      const mockSourceFiles: MockSourceFile[] = [
        {
          getClasses: jest.fn().mockReturnValue([{}, {}]), // 2 classes
          getFunctions: jest.fn().mockReturnValue([{}, {}, {}]), // 3 functions
          getInterfaces: jest.fn().mockReturnValue([{}]), // 1 interface
        },
        {
          getClasses: jest.fn().mockReturnValue([{}]), // 1 class
          getFunctions: jest.fn().mockReturnValue([{}]), // 1 function
          getInterfaces: jest.fn().mockReturnValue([{}, {}]), // 2 interfaces
        },
      ];

      adapter.createProject();
      mockProject.getSourceFiles.mockReturnValue(mockSourceFiles as unknown as SourceFile[]);

      // Act
      const statistics = adapter.getProjectStatistics();

      // Assert
      expect(statistics).toEqual({
        totalClasses: 3, // 2 + 1
        totalFiles: 2,
        totalFunctions: 4, // 3 + 1
        totalInterfaces: 3, // 1 + 2
      });
    });

    it("should return zero statistics when project has no files", () => {
      // Arrange
      adapter.createProject();
      mockProject.getSourceFiles.mockReturnValue([]);

      // Act
      const statistics = adapter.getProjectStatistics();

      // Assert
      expect(statistics).toEqual({
        totalClasses: 0,
        totalFiles: 0,
        totalFunctions: 0,
        totalInterfaces: 0,
      });
    });

    it("should handle files with no classes, functions, or interfaces", () => {
      // Arrange
      const mockSourceFiles: MockSourceFile[] = [
        {
          getClasses: jest.fn().mockReturnValue([]),
          getFunctions: jest.fn().mockReturnValue([]),
          getInterfaces: jest.fn().mockReturnValue([]),
        },
        {
          getClasses: jest.fn().mockReturnValue([]),
          getFunctions: jest.fn().mockReturnValue([]),
          getInterfaces: jest.fn().mockReturnValue([]),
        },
      ];

      adapter.createProject();
      mockProject.getSourceFiles.mockReturnValue(mockSourceFiles as unknown as SourceFile[]);

      // Act
      const statistics = adapter.getProjectStatistics();

      // Assert
      expect(statistics).toEqual({
        totalClasses: 0,
        totalFiles: 2,
        totalFunctions: 0,
        totalInterfaces: 0,
      });
    });

    it("should throw error when project is not initialized", () => {
      // Act & Assert
      expect(() => adapter.getProjectStatistics()).toThrow(
        "Project not initialized. Call createProject() first.",
      );
    });

    it("should throw error after reset", () => {
      // Arrange
      adapter.createProject();
      adapter.reset();

      // Act & Assert
      expect(() => adapter.getProjectStatistics()).toThrow(
        "Project not initialized. Call createProject() first.",
      );
    });

    it("should call getSourceFiles on the project", () => {
      // Arrange
      adapter.createProject();
      mockProject.getSourceFiles.mockReturnValue([]);

      // Act
      adapter.getProjectStatistics();

      // Assert
      expect(mockProject.getSourceFiles).toHaveBeenCalledTimes(1);
    });
  });

  describe("reset", () => {
    it("should reset project to null", () => {
      // Arrange
      adapter.createProject();

      // Act
      adapter.reset();

      // Assert - Verify that subsequent operations fail
      expect(() => {
        adapter.addSourceFiles(["test.ts"]);
      }).toThrow("Project not initialized. Call createProject() first.");
      expect(() => adapter.getProjectStatistics()).toThrow(
        "Project not initialized. Call createProject() first.",
      );
    });

    it("should be safe to call reset multiple times", () => {
      // Arrange
      adapter.createProject();

      // Act
      adapter.reset();
      adapter.reset();

      // Assert - Should not throw
      expect(() => {
        adapter.reset();
      }).not.toThrow();
    });

    it("should be safe to call reset without initializing project", () => {
      // Act & Assert
      expect(() => {
        adapter.reset();
      }).not.toThrow();
    });
  });

  describe("integration", () => {
    it("should work through complete workflow", () => {
      // Arrange
      const filePaths = ["src/test.ts"];
      const mockSourceFiles: MockSourceFile[] = [
        {
          getClasses: jest.fn().mockReturnValue([{}]),
          getFunctions: jest.fn().mockReturnValue([{}, {}]),
          getInterfaces: jest.fn().mockReturnValue([]),
        },
      ];

      // Act
      adapter.createProject("./tsconfig.json");
      adapter.addSourceFiles(filePaths);

      mockProject.getSourceFiles.mockReturnValue(mockSourceFiles as unknown as SourceFile[]);
      const statistics = adapter.getProjectStatistics();

      adapter.reset();

      // Assert
      expect(MockProject).toHaveBeenCalledWith({
        tsConfigFilePath: "./tsconfig.json",
      });
      expect(mockProject.addSourceFilesAtPaths).toHaveBeenCalledWith(filePaths);
      expect(statistics).toEqual({
        totalClasses: 1,
        totalFiles: 1,
        totalFunctions: 2,
        totalInterfaces: 0,
      });

      // Verify reset worked
      expect(() => adapter.getProjectStatistics()).toThrow();
    });
  });
});
