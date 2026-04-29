describe("bin entrypoint integration", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("runs CLI and exits with returned code", async () => {
    const runCli = vi.fn(async () => 5);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

    vi.doMock("#/program", () => ({ runCli }));
    await import("#/bin");

    expect(runCli).toHaveBeenCalledWith(process.argv);
    expect(exitSpy).toHaveBeenCalledWith(5);
    exitSpy.mockRestore();
  });
});
