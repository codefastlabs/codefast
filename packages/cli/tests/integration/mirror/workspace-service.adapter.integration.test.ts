import { PackageFilterPathResolver } from "#/domains/mirror/infrastructure/package-filter-resolver.service";
import { WorkspaceServiceAdapter } from "#/domains/mirror/infrastructure/adapters/workspace-service.adapter";
import { WorkspacePackageDiscovery } from "#/domains/mirror/infrastructure/workspace-packages.service";

describe("WorkspaceServiceAdapter integration", () => {
  it("delegates package filter resolve and package discovery", async () => {
    const packageFilterResolver = new PackageFilterPathResolver();
    const resolverSpy = vi
      .spyOn(packageFilterResolver, "resolvePackageFilterUnderRoot")
      .mockReturnValue("/tmp/root/packages/a");

    const workspacePackageDiscovery = new WorkspacePackageDiscovery({
      existsSync: vi.fn(),
    } as never);
    const discoverySpy = vi
      .spyOn(workspacePackageDiscovery, "findWorkspacePackageRelPaths")
      .mockResolvedValue({
        relPaths: ["packages/a"],
        multiSource: "default-patterns",
      });

    const adapter = new WorkspaceServiceAdapter(packageFilterResolver, workspacePackageDiscovery);
    const warningSpy = vi.fn();

    const resolved = adapter.resolvePackageFilterUnderRoot("/tmp/root", "packages/a");
    const discovery = await adapter.findWorkspacePackageRelPaths("/tmp/root", warningSpy);

    expect(resolverSpy).toHaveBeenCalledWith("/tmp/root", "packages/a");
    expect(discoverySpy).toHaveBeenCalledWith("/tmp/root", warningSpy);
    expect(resolved).toBe("/tmp/root/packages/a");
    expect(discovery.relPaths).toEqual(["packages/a"]);
  });
});
