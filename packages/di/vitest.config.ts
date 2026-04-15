import * as esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const packageRoot = fileURLToPath(new URL(".", import.meta.url));

function normalizeModuleId(id: string): string {
  const withoutVirtualPrefix = id.startsWith("\0") ? id.slice(1) : id;
  const withoutFileUrl = withoutVirtualPrefix.startsWith("file://")
    ? fileURLToPath(withoutVirtualPrefix)
    : withoutVirtualPrefix;
  const queryIndex = withoutFileUrl.indexOf("?");
  return queryIndex === -1 ? withoutFileUrl : withoutFileUrl.slice(0, queryIndex);
}

/**
 * Vite 8 defaults to Oxc for TypeScript, which does not match TS/esbuild Stage 3
 * decorator + static-block evaluation order required by `@injectable()` + `inject.param`.
 */
function esbuildTypeScriptDecorators() {
  return {
    name: "di-test-esbuild-typescript-decorators",
    enforce: "pre",
    async transform(source: string | Uint8Array<ArrayBufferLike>, id: string) {
      const cleanId = normalizeModuleId(id);
      if (!cleanId.endsWith(".ts") || cleanId.includes(`${path.sep}node_modules${path.sep}`)) {
        return;
      }
      const result = await esbuild.transform(source, {
        loader: "ts",
        format: "esm",
        target: "es2022",
        sourcemap: true,
        sourcefile: cleanId,
      });
      if (!result.code) {
        return undefined;
      }
      return { code: result.code, map: result.map };
    },
  };
}

export default defineConfig({
  oxc: false,
  plugins: [esbuildTypeScriptDecorators()],
  resolve: {
    alias: {
      "#lib": path.join(packageRoot, "src"),
    },
  },
  test: {
    include: ["test/**/*.test.ts", "src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts"],
    },
  },
});
