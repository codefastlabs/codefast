import { codefastTheme } from "#/adapters/tanstack-start/vite";

describe("codefastTheme vite plugin", () => {
  test("registers under a stable plugin name", () => {
    expect(codefastTheme().name).toBe("codefast:theme");
  });

  test("opts @codefast/theme out of SSR externalization and client pre-bundling", () => {
    const plugin = codefastTheme();
    const configHook = plugin.config;

    expect(typeof configHook).toBe("function");

    const result =
      typeof configHook === "function"
        ? configHook.call(undefined as never, {}, { command: "serve", mode: "development" })
        : undefined;

    expect(result).toEqual({
      ssr: { noExternal: ["@codefast/theme"] },
      optimizeDeps: { exclude: ["@codefast/theme"] },
    });
  });
});
