/**
 * Server-only highlighter behind `getHighlightedSources` (imported only inside its
 * handler) so Shiki and the raw sources never reach a client chunk. Sources are lazy
 * `?raw` imports — only the refs a call actually needs are loaded, instead of every
 * registry file's raw text riding in the server bundle upfront.
 */
import type { HighlighterCore } from "shiki/core";
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

import type { HighlightedSource } from "#/lib/highlight";
import type { SourceRef } from "#/registry/_core/types";

/** Raw-text loaders for every highlightable registry file, keyed by `SourceRef`. */
const rawSources = import.meta.glob<string>(["../*/*.example.tsx", "../*/demo.tsx", "../*/usage.tsx"], {
  query: "?raw",
  import: "default",
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
async function highlight(ref: SourceRef, highlighter: HighlighterCore): Promise<HighlightedSource> {
  const loadCode = rawSources[ref];

  if (!loadCode) {
    throw new Error(`No source file for ref "${ref}" under registry/.`);
  }

  const code = await loadCode();
  const html = highlighter.codeToHtml(code, {
    lang: "tsx",
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: "light",
  });

  return { code, html };
}

/**
 * Highlights every ref in one pass, sharing a single highlighter instance —
 * one server-fn round trip per doc instead of one per example.
 */
export async function highlightSources(refs: ReadonlyArray<SourceRef>): Promise<Record<SourceRef, HighlightedSource>> {
  const highlighter = await getHighlighter();
  const entries = await Promise.all(
    refs.map(async (ref): Promise<[SourceRef, HighlightedSource]> => [ref, await highlight(ref, highlighter)]),
  );

  return Object.fromEntries(entries);
}
