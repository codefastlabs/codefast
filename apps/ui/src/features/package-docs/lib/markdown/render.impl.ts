/**
 * Server-only markdown renderer: `marked` for the document, Shiki for its code blocks. Headings get
 * GitHub-style ids, links are rewritten to the site or GitHub, and the `##`/`###` outline comes back as
 * a TOC — all at build time, since every doc page is prerendered.
 */
import { Marked } from "marked";
import type { Tokens } from "marked";
import type { HighlighterCore } from "shiki/core";
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

import type { TocItem } from "#/features/components-catalog/components/detail/toc";
import { rewriteDocImage, rewriteDocLink } from "#/features/package-docs/lib/markdown/rewrite-link";
import type { LinkContext } from "#/features/package-docs/lib/markdown/rewrite-link";
import { Slugger, plainHeadingText } from "#/features/package-docs/lib/markdown/slug";

/** The output of one render: the HTML plus what the page chrome needs from the document. */
export interface RenderedMarkdown {
  readonly title: string | null;
  readonly html: string;
  readonly toc: ReadonlyArray<TocItem>;
}

/** Fence languages the repo's docs use, mapped to the grammar Shiki loads for them. */
const LANGUAGE_BY_FENCE: ReadonlyMap<string, string> = new Map([
  ["ts", "typescript"],
  ["typescript", "typescript"],
  ["tsx", "tsx"],
  ["js", "javascript"],
  ["javascript", "javascript"],
  ["jsx", "jsx"],
  ["json", "json"],
  ["jsonc", "jsonc"],
  ["bash", "bash"],
  ["sh", "bash"],
  ["shell", "bash"],
  ["zsh", "bash"],
  ["css", "css"],
  ["yaml", "yaml"],
  ["yml", "yaml"],
  ["html", "html"],
  ["diff", "diff"],
  ["md", "markdown"],
  ["markdown", "markdown"],
]);

let highlighterPromise: Promise<HighlighterCore> | null = null;

function getHighlighter(): Promise<HighlighterCore> {
  highlighterPromise ??= createHighlighterCore({
    engine: createJavaScriptRegexEngine(),
    langs: [
      import("shiki/langs/typescript.mjs"),
      import("shiki/langs/tsx.mjs"),
      import("shiki/langs/javascript.mjs"),
      import("shiki/langs/jsx.mjs"),
      import("shiki/langs/json.mjs"),
      import("shiki/langs/jsonc.mjs"),
      import("shiki/langs/bash.mjs"),
      import("shiki/langs/css.mjs"),
      import("shiki/langs/yaml.mjs"),
      import("shiki/langs/html.mjs"),
      import("shiki/langs/diff.mjs"),
      import("shiki/langs/markdown.mjs"),
    ],
    themes: [import("shiki/themes/github-dark.mjs"), import("shiki/themes/github-light.mjs")],
  });

  return highlighterPromise;
}

function escapeHtml(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

/** A fenced block without a known grammar still renders as a code surface, just unhighlighted. */
function plainCodeBlock(code: string, escaped: boolean | undefined): string {
  return `<pre class="shiki"><code>${escaped ? code : escapeHtml(code)}</code></pre>`;
}

/** Wraps a code surface with the copy button `MarkdownBody` handles by event delegation. */
function codeBlock(pre: string): string {
  return `<div class="markdown-code">${pre}<button type="button" class="markdown-copy" data-copy-code aria-label="Copy code">Copy</button></div>\n`;
}

/** Renders one markdown document written at `context` (the package and file the links resolve from). */
export async function renderMarkdown(source: string, context: LinkContext): Promise<RenderedMarkdown> {
  const highlighter = await getHighlighter();
  const slugger = new Slugger();
  const toc: Array<TocItem> = [];
  const highlighted = new WeakMap<Tokens.Code, string>();
  let title: string | null = null;

  const marked = new Marked({
    async: true,
    gfm: true,
    walkTokens(token) {
      if (token.type !== "code") {
        return;
      }

      const codeToken = token as Tokens.Code;
      const lang = LANGUAGE_BY_FENCE.get((codeToken.lang ?? "").trim().split(/\s+/)[0] ?? "");

      if (lang) {
        highlighted.set(
          codeToken,
          highlighter.codeToHtml(codeToken.text, {
            lang,
            themes: { light: "github-light", dark: "github-dark" },
            defaultColor: "light",
          }),
        );
      }
    },
    renderer: {
      heading({ tokens, depth, text }) {
        const id = slugger.slug(text);
        const label = plainHeadingText(text);

        // The first `#` becomes the page title the header renders, so it is dropped from the body.
        if (depth === 1 && title === null) {
          title = label;

          return "";
        }

        if (depth === 2 || depth === 3) {
          toc.push({ id, label, depth: depth === 2 ? 1 : 2 });
        }

        return `<h${depth} id="${id}"><a href="#${id}" class="heading-anchor">${this.parser.parseInline(tokens)}</a></h${depth}>\n`;
      },
      code(token) {
        // A mermaid fence renders client-side in `MarkdownBody`, so it ships as a plain
        // source-bearing element with no copy chip — that button belongs on code, not a diagram.
        if (((token.lang ?? "").trim().split(/\s+/)[0] ?? "") === "mermaid") {
          return `<pre class="mermaid">${escapeHtml(token.text)}</pre>\n`;
        }

        return codeBlock(highlighted.get(token) ?? plainCodeBlock(token.text, token.escaped));
      },
      link({ href, title: linkTitle, tokens }) {
        const target = rewriteDocLink(href, context);
        const titleAttr = linkTitle ? ` title="${escapeHtml(linkTitle)}"` : "";
        const external = /^[a-z][a-z0-9+.-]*:/i.test(target) ? ' rel="noreferrer"' : "";

        return `<a href="${escapeHtml(target)}"${titleAttr}${external}>${this.parser.parseInline(tokens)}</a>`;
      },
      image({ href, title: imageTitle, text }) {
        const titleAttr = imageTitle ? ` title="${escapeHtml(imageTitle)}"` : "";

        return `<img src="${escapeHtml(rewriteDocImage(href, context))}" alt="${escapeHtml(text)}"${titleAttr}>`;
      },
    },
  });

  const html = await marked.parse(source);

  return { title, html, toc };
}
