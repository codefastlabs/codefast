/**
 * Tests for Fast Glob File System Adapter
 */

// Import the mocked glob function
import pkg from "fast-glob";

import { FastGlobFileSystemAdapter } from "./file-system.adapter";

jest.mock("chalk", () => ({
  __esModule: true,
  default: {
    cyan: jest.fn((text: string) => `cyan(${text})`),
  },
}));

// Mock fast-glob
jest.mock("fast-glob", () => ({
  __esModule: true,
  default: {
    glob: jest.fn(),
  },
}));

// Mock console.error and process.stdout.write
const mockConsoleError = jest.spyOn(console, "error").mockImplementation(() => {
  /* noop */
});
const mockStdoutWrite = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
const { glob } = pkg;
const mockGlob = glob as jest.MockedFunction<typeof glob>;

describe("FastGlobFileSystemAdapter", () => {
  let adapter: FastGlobFileSystemAdapter;

  beforeEach(() => {
    adapter = new FastGlobFileSystemAdapter();
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
    mockStdoutWrite.mockRestore();
  });

  describe("findFiles", () => {
    it("should find files with default ignore patterns", async () => {
      // Arrange
      const pattern = "src/**/*.ts";
      const mockFiles = ["src/file1.ts", "src/file2.ts"];

      mockGlob.mockResolvedValue(mockFiles);

      // Act
      const result = await adapter.findFiles(pattern);

      // Assert
      expect(mockGlob).toHaveBeenCalledWith(pattern, {
        ignore: ["node_modules/**", "dist/**", "**/*.d.ts"],
      });
      expect(result).toEqual(mockFiles);
    });

    it("should find files with custom ignore patterns", async () => {
      // Arrange
      const pattern = "lib/**/*.js";
      const options = { ignore: ["test/**", "build/**"] };
      const mockFiles = ["lib/file1.js"];

      mockGlob.mockResolvedValue(mockFiles);

      // Act
      const result = await adapter.findFiles(pattern, options);

      // Assert
      expect(mockGlob).toHaveBeenCalledWith(pattern, {
        ignore: ["test/**", "build/**"],
      });
      expect(result).toEqual(mockFiles);
    });

    it("should return empty array when no files found", async () => {
      // Arrange
      const pattern = "nonexistent/**/*.ts";

      mockGlob.mockResolvedValue([]);

      // Act
      const result = await adapter.findFiles(pattern);

      // Assert
      expect(result).toEqual([]);
    });

    it("should handle glob errors gracefully", async () => {
      // Arrange
      const pattern = "invalid-pattern";
      const error = new Error("Glob error");

      mockGlob.mockRejectedValue(error);

      // Act
      const result = await adapter.findFiles(pattern);

      // Assert
      expect(mockConsoleError).toHaveBeenCalledWith("Error finding files: Error: Glob error");
      expect(result).toEqual([]);
    });
  });

  describe("pathExists", () => {
    it("should return true when path exists", async () => {
      // Arrange
      const pattern = "src/existing-file.ts";

      mockGlob.mockResolvedValue(["src/existing-file.ts"]);

      // Act
      const result = await adapter.pathExists(pattern);

      // Assert
      expect(mockGlob).toHaveBeenCalledWith(pattern);
      expect(result).toBe(true);
    });

    it("should return false when path does not exist", async () => {
      // Arrange
      const pattern = "src/nonexistent-file.ts";

      mockGlob.mockResolvedValue([]);

      // Act
      const result = await adapter.pathExists(pattern);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false when glob throws error", async () => {
      // Arrange
      const pattern = "invalid-pattern";

      mockGlob.mockRejectedValue(new Error("Glob error"));

      // Act
      const result = await adapter.pathExists(pattern);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("formatFileSize", () => {
    it("should format bytes correctly", () => {
      expect(adapter.formatFileSize(0)).toBe("0 Bytes");
      expect(adapter.formatFileSize(512)).toBe("512 Bytes");
      expect(adapter.formatFileSize(1023)).toBe("1023 Bytes");
    });

    it("should format kilobytes correctly", () => {
      expect(adapter.formatFileSize(1024)).toBe("1 KB");
      expect(adapter.formatFileSize(1536)).toBe("1.5 KB");
      expect(adapter.formatFileSize(2048)).toBe("2 KB");
    });

    it("should format megabytes correctly", () => {
      expect(adapter.formatFileSize(1024 * 1024)).toBe("1 MB");
      expect(adapter.formatFileSize(1024 * 1024 * 1.5)).toBe("1.5 MB");
      expect(adapter.formatFileSize(1024 * 1024 * 2.25)).toBe("2.25 MB");
    });

    it("should format gigabytes correctly", () => {
      expect(adapter.formatFileSize(1024 * 1024 * 1024)).toBe("1 GB");
      expect(adapter.formatFileSize(1024 * 1024 * 1024 * 2.5)).toBe("2.5 GB");
    });

    it("should format terabytes correctly", () => {
      const largeNumber = 1024 * 1024 * 1024 * 1024; // 1 TB
      const result = adapter.formatFileSize(largeNumber);

      expect(result).toBe("1 TB");
    });

    it("should handle extremely large numbers by clamping to PB", () => {
      const extremelyLargeNumber = 1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024; // Beyond PB
      const result = adapter.formatFileSize(extremelyLargeNumber);

      // Should clamp to PB (the largest supported unit)
      expect(result).toContain("PB");
    });
  });

  describe("createProgressIndicator", () => {
    it("should create progress indicator with correct methods", () => {
      // Act
      const indicator = adapter.createProgressIndicator(10);

      // Assert
      expect(indicator).toHaveProperty("increment");
      expect(indicator).toHaveProperty("finish");
      expect(typeof indicator.increment).toBe("function");
      expect(typeof indicator.finish).toBe("function");
    });

    it("should display progress correctly on increment", () => {
      // Arrange
      const total = 10;
      const indicator = adapter.createProgressIndicator(total);

      // Act
      indicator.increment(); // 1/10 = 10%
      indicator.increment(); // 2/10 = 20%

      // Assert
      expect(mockStdoutWrite).toHaveBeenCalledTimes(2);

      // Check first call (10%)
      const firstCall = mockStdoutWrite.mock.calls[0][0] as string;

      expect(firstCall).toContain("10%");
      expect(firstCall).toContain("(1/10)");

      // Check second call (20%)
      const secondCall = mockStdoutWrite.mock.calls[1][0] as string;

      expect(secondCall).toContain("20%");
      expect(secondCall).toContain("(2/10)");
    });

    it("should display full progress bar at 100%", () => {
      // Arrange
      const total = 4;
      const indicator = adapter.createProgressIndicator(total);

      // Act - increment to 100%
      for (let index = 0; index < total; index++) {
        indicator.increment();
      }

      // Assert
      const lastCall = mockStdoutWrite.mock.calls.at(-1)?.[0] as string;

      expect(lastCall).toContain("100%");
      expect(lastCall).toContain("(4/4)");
      expect(lastCall).toContain("████████████████████"); // Full bar (20 filled blocks)
    });

    it("should display empty progress bar at 0%", () => {
      // Arrange
      const total = 100;
      const indicator = adapter.createProgressIndicator(total);

      // Act
      indicator.increment(); // 1/100 = 1%

      // Assert
      const call = mockStdoutWrite.mock.calls[0][0] as string;

      expect(call).toContain("1%");
      expect(call).toContain("(1/100)");
      // At 1%, should have mostly empty blocks
      expect(call).toContain("░░░░░░░░░░░░░░░░░░░"); // Mostly empty
    });

    it("should finish progress indicator correctly", () => {
      // Arrange
      const indicator = adapter.createProgressIndicator(5);

      // Act
      indicator.finish();

      // Assert
      expect(mockStdoutWrite).toHaveBeenCalledWith("\n");
    });

    it("should handle edge case with total of 1", () => {
      // Arrange
      const indicator = adapter.createProgressIndicator(1);

      // Act
      indicator.increment(); // 1/1 = 100%

      // Assert
      const call = mockStdoutWrite.mock.calls[0][0] as string;

      expect(call).toContain("100%");
      expect(call).toContain("(1/1)");
    });
  });
});
