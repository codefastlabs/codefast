import { WorkspaceServiceAdapter } from "#/lib/mirror/adapters/secondary/workspace-service.adapter";
import * as packageFilterResolver from "#/lib/mirror/infrastructure/package-filter-resolver.service";
import * as workspacePackagesService from "#/lib/mirror/infrastructure/workspace-packages.service";

describe("WorkspaceServiceAdapter integration", () => {
  it("delegates package filter resolve and package discovery", async () => {
    const resolverSpy = vi
      .spyOn(packageFilterResolver, "resolvePackageFilterUnderRoot")
      .mockReturnValue("/tmp/root/packages/a");
    const discoverySpy = vi
      .spyOn(workspacePackagesService, "findWorkspacePackageRelPaths")
      .mockResolvedValue({
        packageRelPaths: ["packages/a"],
        source: "default-patterns",
      });
    const fakeFs = { existsSync: vi.fn() };
    const adapter = new WorkspaceServiceAdapter(fakeFs as never);
    const warningSpy = vi.fn();

    const resolved = adapter.resolvePackageFilterUnderRoot("/tmp/root", "packages/a");
    const discovery = await adapter.findWorkspacePackageRelPaths("/tmp/root", warningSpy);

    expect(resolverSpy).toHaveBeenCalledWith("/tmp/root", "packages/a");
    expect(discoverySpy).toHaveBeenCalledWith("/tmp/root", fakeFs, warningSpy);
    expect(resolved).toBe("/tmp/root/packages/a");
    expect(discovery.packageRelPaths).toEqual(["packages/a"]);
  });
});
