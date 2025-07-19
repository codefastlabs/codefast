import { logger } from "./index";

// Mock chalk to avoid ESM import issues
jest.mock("chalk", () => {
  const mockChalk = {
    blue: (text: string): string => `blue(${text})`,
    gray: (text: string): string => `gray(${text})`,
    green: (text: string): string => `green(${text})`,
    red: (text: string): string => `red(${text})`,
    yellow: (text: string): string => `yellow(${text})`,
  };

  return {
    __esModule: true,
    default: mockChalk,
  };
});

// Mock console.log to capture output
const mockConsoleLog = jest.fn();

console.log = mockConsoleLog;

describe("logger", () => {
  beforeEach(() => {
    mockConsoleLog.mockClear();
  });

  describe("debug", () => {
    it("should log debug message with gray color and bug emoji", () => {
      const message = "This is a debug message";

      logger.debug(message);

      expect(mockConsoleLog).toHaveBeenCalledWith(`gray(🐛 ${message})`);
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    });

    it("should handle empty message", () => {
      logger.debug("");

      expect(mockConsoleLog).toHaveBeenCalledWith(`gray(🐛 )`);
    });
  });

  describe("error", () => {
    it("should log error message with red color and cross emoji", () => {
      const message = "This is an error message";

      logger.error(message);

      expect(mockConsoleLog).toHaveBeenCalledWith(`red(❌ ${message})`);
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    });

    it("should handle empty message", () => {
      logger.error("");

      expect(mockConsoleLog).toHaveBeenCalledWith(`red(❌ )`);
    });
  });

  describe("info", () => {
    it("should log info message with blue color and info emoji", () => {
      const message = "This is an info message";

      logger.info(message);

      expect(mockConsoleLog).toHaveBeenCalledWith(`blue(ℹ ${message})`);
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    });

    it("should handle empty message", () => {
      logger.info("");

      expect(mockConsoleLog).toHaveBeenCalledWith(`blue(ℹ )`);
    });
  });

  describe("success", () => {
    it("should log success message with green color and checkmark emoji", () => {
      const message = "This is a success message";

      logger.success(message);

      expect(mockConsoleLog).toHaveBeenCalledWith(`green(✅ ${message})`);
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    });

    it("should handle empty message", () => {
      logger.success("");

      expect(mockConsoleLog).toHaveBeenCalledWith(`green(✅ )`);
    });
  });

  describe("warning", () => {
    it("should log warning message with yellow color and warning emoji", () => {
      const message = "This is a warning message";

      logger.warning(message);

      expect(mockConsoleLog).toHaveBeenCalledWith(`yellow(⚠️ ${message})`);
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    });

    it("should handle empty message", () => {
      logger.warning("");

      expect(mockConsoleLog).toHaveBeenCalledWith(`yellow(⚠️ )`);
    });
  });

  describe("all logger methods", () => {
    it("should handle special characters and unicode", () => {
      const specialMessage = "Special chars: @#$%^&*()_+ 中文 🚀";

      logger.debug(specialMessage);
      logger.error(specialMessage);
      logger.info(specialMessage);
      logger.success(specialMessage);
      logger.warning(specialMessage);

      expect(mockConsoleLog).toHaveBeenCalledTimes(5);
      expect(mockConsoleLog).toHaveBeenNthCalledWith(1, `gray(🐛 ${specialMessage})`);
      expect(mockConsoleLog).toHaveBeenNthCalledWith(2, `red(❌ ${specialMessage})`);
      expect(mockConsoleLog).toHaveBeenNthCalledWith(3, `blue(ℹ ${specialMessage})`);
      expect(mockConsoleLog).toHaveBeenNthCalledWith(4, `green(✅ ${specialMessage})`);
      expect(mockConsoleLog).toHaveBeenNthCalledWith(5, `yellow(⚠️ ${specialMessage})`);
    });

    it("should handle long messages", () => {
      const longMessage = "A".repeat(1000);

      logger.info(longMessage);

      expect(mockConsoleLog).toHaveBeenCalledWith(`blue(ℹ ${longMessage})`);
    });
  });
});
