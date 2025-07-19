/**
 * Tests for Chalk Logging Adapter
 */

import { ChalkLoggingAdapter } from "./logging.adapter";

jest.mock("chalk", () => ({
  __esModule: true,
  default: {
    blue: jest.fn((text) => `blue(${text})`),
    gray: jest.fn((text) => `gray(${text})`),
    green: jest.fn((text) => `green(${text})`),
    red: jest.fn((text) => `red(${text})`),
    yellow: jest.fn((text) => `yellow(${text})`),
  },
}));

// Mock console.log to capture output
const mockConsoleLog = jest.spyOn(console, "log").mockImplementation(() => {
  /* noop */
});

describe("ChalkLoggingAdapter", () => {
  let adapter: ChalkLoggingAdapter;

  beforeEach(() => {
    adapter = new ChalkLoggingAdapter();
    mockConsoleLog.mockClear();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
  });

  describe("debug", () => {
    it("should log debug message with gray color and bug emoji", () => {
      // Arrange
      const message = "Debug message";

      // Act
      adapter.debug(message);

      // Assert
      expect(mockConsoleLog).toHaveBeenCalledWith(`gray(🐛 ${message})`);
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    });

    it("should handle empty debug message", () => {
      // Arrange
      const message = "";

      // Act
      adapter.debug(message);

      // Assert
      expect(mockConsoleLog).toHaveBeenCalledWith("gray(🐛 )");
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    });
  });

  describe("error", () => {
    it("should log error message with red color and cross emoji", () => {
      // Arrange
      const message = "Error message";

      // Act
      adapter.error(message);

      // Assert
      expect(mockConsoleLog).toHaveBeenCalledWith(`red(❌ ${message})`);
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    });

    it("should handle multiline error message", () => {
      // Arrange
      const message = "Line 1\nLine 2";

      // Act
      adapter.error(message);

      // Assert
      expect(mockConsoleLog).toHaveBeenCalledWith(`red(❌ ${message})`);
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    });
  });

  describe("info", () => {
    it("should log info message with blue color and info emoji", () => {
      // Arrange
      const message = "Info message";

      // Act
      adapter.info(message);

      // Assert
      expect(mockConsoleLog).toHaveBeenCalledWith(`blue(ℹ ${message})`);
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    });

    it("should handle special characters in info message", () => {
      // Arrange
      const message = "Special chars: @#$%^&*()";

      // Act
      adapter.info(message);

      // Assert
      expect(mockConsoleLog).toHaveBeenCalledWith(`blue(ℹ ${message})`);
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    });
  });

  describe("success", () => {
    it("should log success message with green color and checkmark emoji", () => {
      // Arrange
      const message = "Success message";

      // Act
      adapter.success(message);

      // Assert
      expect(mockConsoleLog).toHaveBeenCalledWith(`green(✅ ${message})`);
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    });

    it("should handle long success message", () => {
      // Arrange
      const message =
        "This is a very long success message that contains multiple words and should be handled properly";

      // Act
      adapter.success(message);

      // Assert
      expect(mockConsoleLog).toHaveBeenCalledWith(`green(✅ ${message})`);
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    });
  });

  describe("warning", () => {
    it("should log warning message with yellow color and warning emoji", () => {
      // Arrange
      const message = "Warning message";

      // Act
      adapter.warning(message);

      // Assert
      expect(mockConsoleLog).toHaveBeenCalledWith(`yellow(⚠️ ${message})`);
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    });

    it("should handle numeric warning message", () => {
      // Arrange
      const message = "404 - Not found";

      // Act
      adapter.warning(message);

      // Assert
      expect(mockConsoleLog).toHaveBeenCalledWith(`yellow(⚠️ ${message})`);
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    });
  });

  describe("integration", () => {
    it("should handle multiple consecutive log calls", () => {
      // Arrange
      const messages = ["First", "Second", "Third"];

      // Act
      adapter.info(messages[0]);
      adapter.success(messages[1]);
      adapter.warning(messages[2]);

      // Assert
      expect(mockConsoleLog).toHaveBeenCalledTimes(3);
      expect(mockConsoleLog).toHaveBeenNthCalledWith(1, `blue(ℹ ${messages[0]})`);
      expect(mockConsoleLog).toHaveBeenNthCalledWith(2, `green(✅ ${messages[1]})`);
      expect(mockConsoleLog).toHaveBeenNthCalledWith(3, `yellow(⚠️ ${messages[2]})`);
    });
  });
});
