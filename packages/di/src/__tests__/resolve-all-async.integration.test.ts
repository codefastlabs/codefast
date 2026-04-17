import { describe, expect, it } from "vitest";
import { AsyncResolutionError, Container, token } from "#/index";

describe("Container.resolveAllAsync (spec §5.2)", () => {
  it("resolves multi-bindings that mix sync and async factories", async () => {
    const pluginToken = token<string>("resolve-all-async-plugin");
    const container = Container.create();

    container.bind(pluginToken).toConstantValue("sync-a");
    container.bind(pluginToken).toDynamic(() => "sync-b");
    container.bind(pluginToken).toDynamicAsync(async () => {
      await Promise.resolve();
      return "async-c";
    });

    const resolvedPlugins = await container.resolveAllAsync(pluginToken);
    expect(resolvedPlugins).toEqual(["sync-a", "sync-b", "async-c"]);
  });

  it("resolveAll (sync) still throws on async bindings — resolveAllAsync is the safe variant", () => {
    const pluginToken = token<string>("resolve-all-sync-fail");
    const container = Container.create();
    container.bind(pluginToken).toConstantValue("sync");
    container.bind(pluginToken).toDynamicAsync(async () => "async");

    expect(() => {
      container.resolveAll(pluginToken);
    }).toThrow(AsyncResolutionError);
  });

  it("returns [] for an unbound token (parity with resolveAll)", async () => {
    const unboundToken = token<string>("resolve-all-async-missing");
    const container = Container.create();
    await expect(container.resolveAllAsync(unboundToken)).resolves.toEqual([]);
  });
});
