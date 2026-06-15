import { readFile } from "node:fs/promises";

import type { HighlighterCore } from "shiki/core";
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import type { Plugin } from "vite";

const QUERY = "shiki";
const THEME_DARK = "github-dark";
const THEME_LIGHT = "github-light";

let highlighterPromise: Promise<HighlighterCore> | null = null;

function getHighlighter(): Promise<HighlighterCore> {
  highlighterPromise ??= createHighlighterCore({
    engine: createJavaScriptRegexEngine(),
    langs: [import("shiki/langs/tsx.mjs")],
    themes: [import("shiki/themes/github-dark.mjs"), import("shiki/themes/github-light.mjs")],
  });

  return highlighterPromise;
}

/**
 * Build-time syntax highlighting: `import("./file.tsx?shiki")` resolves to a
 * module exporting the raw source (`code`) and its pre-rendered Shiki HTML
 * (`html`). Highlighting happens once, here, at build/dev-transform time — the
 * Shiki engine, the tsx grammar, and the theme never reach the client bundle
 * or the SSR runtime, and no request ever pays for highlighting again.
 *
 * `.txt` files (anatomy skeletons) are highlighted as tsx, matching the old
 * runtime behaviour.
 */
export function shikiPlugin(): Plugin {
  return {
    name: "shiki-build-time-highlight",
    enforce: "pre",
    async load(id) {
      const [path, query] = id.split("?", 2);

      if (!path || !query?.split("&").includes(QUERY)) {
        return null;
      }

      const code = await readFile(path, "utf8");
      const highlighter = await getHighlighter();
      const htmlDark = highlighter.codeToHtml(code, { lang: "tsx", theme: THEME_DARK });
      const htmlLight = highlighter.codeToHtml(code, { lang: "tsx", theme: THEME_LIGHT });

      return `export const code = ${JSON.stringify(code)};\nexport const htmlDark = ${JSON.stringify(htmlDark)};\nexport const htmlLight = ${JSON.stringify(htmlLight)};\n`;
    },
  };
}
