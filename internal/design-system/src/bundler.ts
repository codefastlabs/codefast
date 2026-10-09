import { build } from "vite";
import type { Plugin, Rolldown } from "vite";

import { NAMESPACE } from "#config";
import { packagePath } from "#paths";

/** The globals a classic script can lean on, because the artifact loads them first. */
export type RuntimeGlobal = "CodefastUI" | "React" | "ReactDOM" | "Recharts";

const SHIM = "\0runtime-global:";

/** A JSX runtime over `React.createElement`, since React ships no global build of `react/jsx-runtime`. */
const JSX_RUNTIME =
  "var R=window.React;function j(t,p,k){return R.createElement(t,k===undefined?p:Object.assign({},p,{key:k}))}module.exports={jsx:j,jsxs:j,jsxDEV:j,Fragment:R.Fragment};";

function globalFor(specifier: string): RuntimeGlobal | undefined {
  if (specifier === "react") {
    return "React";
  }
  if (specifier === "react-dom" || specifier === "react-dom/client") {
    return "ReactDOM";
  }
  if (specifier === "recharts") {
    return "Recharts";
  }
  return specifier === "@codefast/ui" || specifier.startsWith("@codefast/ui/") ? NAMESPACE : undefined;
}

/** Replaces the imports a bundle leaves to the page with reads of the matching `window` global. */
function runtimeGlobals(provided: ReadonlySet<RuntimeGlobal>): Plugin {
  return {
    enforce: "pre",
    load(id) {
      if (!id.startsWith(SHIM)) {
        return undefined;
      }
      const specifier = id.slice(SHIM.length);
      return specifier.startsWith("react/jsx") ? JSX_RUNTIME : `module.exports=window.${globalFor(specifier)};`;
    },
    name: "runtime-globals",
    resolveId(specifier) {
      if (/^react\/jsx-(dev-)?runtime$/.test(specifier) && provided.has("React")) {
        return `${SHIM}${specifier}`;
      }
      const global = globalFor(specifier);
      return global && provided.has(global) ? `${SHIM}${specifier}` : undefined;
    },
  };
}

/** Bundles one entry into a minified classic script, leaving `provided` globals to the page. */
export async function bundleScript(
  entry: string,
  provided: ReadonlySet<RuntimeGlobal>,
  name?: string,
): Promise<string> {
  const result = await build({
    build: {
      copyPublicDir: false,
      lib: { entry, fileName: () => "bundle.js", formats: ["iife"], name: name ?? "__entry" },
      minify: true,
      rolldownOptions: {
        // Libraries mark their modules "use client"; a classic script has no server half to keep apart.
        onLog(level, log, handler) {
          if (log.code !== "MODULE_LEVEL_DIRECTIVE") {
            handler(level, log);
          }
        },
      },
      write: false,
    },
    configFile: false,
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    logLevel: "warn",
    plugins: [runtimeGlobals(provided)],
    root: packagePath(""),
  });
  const outputs: Array<Rolldown.RolldownOutput> = Array.isArray(result) ? result : "output" in result ? [result] : [];
  const chunk = outputs[0]?.output.find((item) => item.type === "chunk");
  if (!chunk) {
    throw new Error(`Bundling ${entry} produced no script`);
  }
  if (/<\/script|<!--/i.test(chunk.code)) {
    throw new Error(`${entry} bundles a literal </script or <!--, which would end an inline script`);
  }
  return chunk.code;
}
