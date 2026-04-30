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
    const arrangePresentationModule = { name: "arrange-presentation-module" };
    const mirrorModule = { name: "mirror-module" };
    const tagModule = { name: "tag-module" };
    const tagPresentationModule = { name: "tag-presentation-module" };
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
    vi.doMock("#/lib/arrange/adapters/primary/cli/arrange.command", () => ({
      ArrangeCommand: ArrangeCommandMock,
    }));
    vi.doMock("#/lib/mirror/adapters/primary/cli/mirror.command", () => ({
      MirrorCommand: MirrorCommandMock,
    }));
    vi.doMock("#/lib/tag/adapters/primary/cli/tag.command", () => ({
      TagCommand: TagCommandMock,
    }));
    vi.doMock("#/lib/arrange/adapters/primary/cli/arrange.presentation.module", () => ({
      ArrangePresentationModule: arrangePresentationModule,
    }));
    vi.doMock("#/lib/arrange/arrange.module", () => ({ ArrangeModule: arrangeModule }));
    vi.doMock("#/lib/mirror/mirror.module", () => ({ MirrorModule: mirrorModule }));
    vi.doMock("#/lib/tag/adapters/primary/cli/tag.presentation.module", () => ({
      TagPresentationModule: tagPresentationModule,
    }));
    vi.doMock("#/lib/tag/tag.module", () => ({ TagModule: tagModule }));
    vi.doMock("#/lib/kernel/contracts/tokens", () => ({
      CliCommandToken: cliCommandTokenStub,
    }));

    const { createCliRuntimeContainer, resolveCliCommands } =
      await import("#/lib/bootstrap/composition-root");
    const container = createCliRuntimeContainer();
    const commands = resolveCliCommands(container as never);

    expect(create).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith(arrangePresentationModule, arrangeModule);
    expect(load).toHaveBeenCalledWith(mirrorModule);
    expect(load).toHaveBeenCalledWith(tagPresentationModule, tagModule);
    expect(bind).toHaveBeenCalledTimes(3);
    expect(resolveAll).toHaveBeenCalledTimes(1);
    expect(resolveAll).toHaveBeenCalledWith(cliCommandTokenStub);
    expect(commands.map((command) => command.name)).toEqual(["arrange", "mirror", "tag"]);
  });
});
