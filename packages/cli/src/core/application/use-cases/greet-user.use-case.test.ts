/**
 * Tests for Greet User Use Case
 */

import type { LoggingService } from "@/core/application/ports/logging.port";

import { GreetUserUseCase } from "./greet-user.use-case";

describe("GreetUserUseCase", () => {
  let useCase: GreetUserUseCase;
  let mockLoggingService: jest.Mocked<LoggingService>;

  beforeEach(() => {
    // Create mock logging service
    mockLoggingService = {
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      success: jest.fn(),
      warning: jest.fn(),
    };

    // Create use case instance with mocked dependency
    useCase = new GreetUserUseCase(mockLoggingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("execute", () => {
    it("should greet user with provided name", () => {
      // Arrange
      const input = { name: "John" };

      // Act
      useCase.execute(input);

      // Assert
      expect(mockLoggingService.success).toHaveBeenCalledWith("Hello, John!");
      expect(mockLoggingService.success).toHaveBeenCalledTimes(1);
    });

    it("should greet user with default name when empty", () => {
      // Arrange
      const input = { name: "" };

      // Act
      useCase.execute(input);

      // Assert
      expect(mockLoggingService.success).toHaveBeenCalledWith("Hello, World!");
      expect(mockLoggingService.success).toHaveBeenCalledTimes(1);
    });

    it("should greet user with default name when only whitespace", () => {
      // Arrange
      const input = { name: "   " };

      // Act
      useCase.execute(input);

      // Assert
      expect(mockLoggingService.success).toHaveBeenCalledWith("Hello, World!");
      expect(mockLoggingService.success).toHaveBeenCalledTimes(1);
    });

    it("should trim whitespace from name", () => {
      // Arrange
      const input = { name: "  John  " };

      // Act
      useCase.execute(input);

      // Assert
      expect(mockLoggingService.success).toHaveBeenCalledWith("Hello, John!");
      expect(mockLoggingService.success).toHaveBeenCalledTimes(1);
    });

    it("should greet user with special characters in name", () => {
      // Arrange
      const input = { name: "José María" };

      // Act
      useCase.execute(input);

      // Assert
      expect(mockLoggingService.success).toHaveBeenCalledWith("Hello, José María!");
      expect(mockLoggingService.success).toHaveBeenCalledTimes(1);
    });

    it("should not call other logging methods", () => {
      // Arrange
      const input = { name: "Test User" };

      // Act
      useCase.execute(input);

      // Assert
      expect(mockLoggingService.info).not.toHaveBeenCalled();
      expect(mockLoggingService.warning).not.toHaveBeenCalled();
      expect(mockLoggingService.error).not.toHaveBeenCalled();
    });
  });
});
