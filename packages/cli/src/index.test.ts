describe("CLI Index", () => {
  let mockRunCLI: jest.MockedFunction<any>;
  let mockConsoleError: jest.SpyInstance;
  let mockProcessExit: jest.SpyInstance;

  beforeEach(() => {
    // Mock the CLI module
    mockRunCLI = jest.fn();
    jest.doMock("./infrastructure/cli/cli", () => ({
      runCLI: mockRunCLI,
    }));

    // Mock console.error and process.exit
    mockConsoleError = jest.spyOn(console, "error").mockImplementation();
    mockProcessExit = jest.spyOn(process, "exit").mockImplementation();
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
    mockProcessExit.mockRestore();
  });

  it("should call runCLI when main function is executed", async () => {
    mockRunCLI.mockResolvedValue();

    // Import and run the main function
    jest.isolateModules(async () => {
      await import("./index");
    });

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockRunCLI).toHaveBeenCalledTimes(1);
  });

  it("should handle CLI errors gracefully", async () => {
    const testError = new Error("Test CLI error");

    mockRunCLI.mockRejectedValue(testError);

    // Import and run the main function
    jest.isolateModules(async () => {
      await import("./index");
    });

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockConsoleError).toHaveBeenCalledWith("CLI Error:", "Test CLI error");
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  it("should handle unknown errors", async () => {
    mockRunCLI.mockRejectedValue("Unknown error string");

    // Import and run the main function
    jest.isolateModules(async () => {
      await import("./index");
    });

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockConsoleError).toHaveBeenCalledWith("CLI Error:", "Unknown error");
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });
});
