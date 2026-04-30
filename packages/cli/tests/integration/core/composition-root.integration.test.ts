describe("composition root integration", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("builds runtime container and resolves CLI commands in order", async () => {
    class ArrangeCommandMock {}
    class MirrorCommandMock {}
    class TagCommandMock {}
    const arrangeModule = { name: "arrange-module" };
    const mirrorModule = { name: "mirror-module" };
    const tagModule = { name: "tag-module" };
    const cliCommandTokenStub = Symbol("CliCommandToken");

    const singleton = vi.fn(() => ({}));
    const whenNamed = vi.fn(() => ({ singleton }));
    // Mirrors real fluent API: bind().to() chains .whenNamed().singleton()
    const to = vi.fn(() => ({ whenNamed }));
    const bind = vi.fn(() => ({ to }));
    const load = vi.fn();
    const resolveAll = vi.fn(() => [{ name: "mirror" }, { name: "arrange" }, { name: "tag" }]);
    const runtimeContainer = { bind, load, resolveAll };
    const create = vi.fn(() => runtimeContainer);

    vi.doMock("@codefast/di", () => ({ Container: { create } }));
    vi.doMock("#/domains/arrange/presentation/cli/arrange.command", () => ({
      ArrangeCommand: ArrangeCommandMock,
    }));
    vi.doMock("#/domains/mirror/presentation/cli/mirror.command", () => ({
      MirrorCommand: MirrorCommandMock,
    }));
    vi.doMock("#/domains/tag/presentation/cli/tag.command", () => ({
      TagCommand: TagCommandMock,
    }));
    vi.doMock("#/domains/arrange/arrange.module", () => ({ ArrangeModule: arrangeModule }));
    vi.doMock("#/domains/mirror/mirror.module", () => ({ MirrorModule: mirrorModule }));
    vi.doMock("#/domains/tag/tag.module", () => ({ TagModule: tagModule }));
    vi.doMock("#/shell/contracts/tokens", () => ({
      CliCommandToken: cliCommandTokenStub,
    }));

    const { createCliRuntimeContainer, resolveCliCommands } =
      await import("#/bootstrap/composition-root");
    const container = createCliRuntimeContainer();
    const commands = resolveCliCommands(container);

    expect(create).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith(arrangeModule);
    expect(load).toHaveBeenCalledWith(mirrorModule);
    expect(load).toHaveBeenCalledWith(tagModule);
    expect(bind).toHaveBeenCalledTimes(3);
    expect(resolveAll).toHaveBeenCalledTimes(1);
    expect(resolveAll).toHaveBeenCalledWith(cliCommandTokenStub);
    expect(commands.map((command) => command.name)).toEqual(["arrange", "mirror", "tag"]);
  });
});
