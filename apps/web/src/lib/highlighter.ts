import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

const THEME = "poimandres";

type Highlighter = Awaited<ReturnType<typeof createHighlighterCore>>;

let _promise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  _promise ??= createHighlighterCore({
    engine: createJavaScriptRegexEngine(),
    langs: [import("shiki/langs/tsx.mjs")],
    themes: [import("shiki/themes/poimandres.mjs")],
  });

  return _promise;
}

export async function highlightMany(codes: Array<string>): Promise<Array<string>> {
  const highlighter = await getHighlighter();
  return codes.map((code) => highlighter.codeToHtml(code, { lang: "tsx", theme: THEME }));
}
