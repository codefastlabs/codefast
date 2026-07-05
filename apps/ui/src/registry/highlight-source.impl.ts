/**
 * Server-only highlighter behind `getHighlightedSource` (imported only inside its
 * handler) so Shiki and the raw sources never reach a client chunk. Sources are
 * eager `?raw` imports so they ride in the server bundle: the `/components/<slug>.md`
 * route highlights at runtime, not only at build-time prerender.
 */
import type { HighlighterCore } from "shiki/core";
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

import type { HighlightedSource } from "#/lib/highlight";
import type { SourceRef } from "#/registry/types";

/** Raw text of every highlightable registry file, keyed by `SourceRef`. */
const rawSources = import.meta.glob<string>(["./*/*.example.tsx", "./*/demo.tsx", "./*/usage.tsx"], {
  query: "?raw",
  import: "default",
  eager: true,
});

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
 * Highlights to one dual-theme tree: `defaultColor: "light"` writes a real light
 * color inline (legible even without theme CSS) plus a `--shiki-dark` var that
 * `styles.css` swaps under `.dark` — half the bytes of a tree per theme.
 */
export async function highlightSource(ref: SourceRef): Promise<HighlightedSource> {
  const code = rawSources[ref];

  if (code === undefined) {
    throw new Error(`No source file for ref "${ref}" under registry/.`);
  }

  const highlighter = await getHighlighter();
  const html = highlighter.codeToHtml(code, {
    lang: "tsx",
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: "light",
  });

  return { code, html };
}
