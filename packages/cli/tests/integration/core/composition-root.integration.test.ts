describe("composition root integration", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("builds runtime container and resolves CLI commands in order", async () => {
    const cliApplicationModule = { name: "cli-application-module" };
    const cliCommandTokenStub = Symbol("CliCommandPortToken");

    const load = vi.fn();
    const resolveAll = vi.fn(() => [
      { definition: { name: "mirror", description: "" } },
      { definition: { name: "arrange", description: "" } },
      { definition: { name: "tag", description: "" } },
    ]);
    const runtimeContainer = { load, resolveAll };
    const create = vi.fn(() => runtimeContainer);

    vi.doMock("@codefast/di", () => ({ Container: { create } }));
    vi.doMock("#/bootstrap/cli-application.module", () => ({
      CliApplicationModule: cliApplicationModule,
    }));
    vi.doMock("#/shell/composition/tokens", () => ({
      CliCommandPortToken: cliCommandTokenStub,
    }));

    const { createCliRuntimeContainer, resolveCliCommands } =
      await import("#/bootstrap/composition-root");
    const container = createCliRuntimeContainer();
    const commands = resolveCliCommands(container);

    expect(create).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith(cliApplicationModule);
    expect(resolveAll).toHaveBeenCalledTimes(1);
    expect(resolveAll).toHaveBeenCalledWith(cliCommandTokenStub);
    expect(commands.map((command) => command.definition.name)).toEqual([
      "arrange",
      "mirror",
      "tag",
    ]);
  });
});
