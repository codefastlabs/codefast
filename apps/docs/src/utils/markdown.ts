import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeStringify from "rehype-stringify";
import rehypeShiki from "@shikijs/rehype";
import { visit } from "unist-util-visit";
import { toString } from "hast-util-to-string";
import type { Element as HastElement, Root as HastRoot } from "hast";

type MarkdownHeading = {
  id: string;
  text: string;
  level: number;
};

type MarkdownResult = {
  html: string;
  headings: Array<MarkdownHeading>;
};

/**
 * Renders markdown to HTML with syntax highlighting.
 * Designed to be called at build-time in content-collections transform.
 */
export async function renderMarkdown(content: string): Promise<MarkdownResult> {
  const headings: Array<MarkdownHeading> = [];

  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: "wrap",
      properties: { className: ["anchor"] },
    })
    .use(() => (tree: HastRoot) => {
      visit(tree, "element", (node: HastElement) => {
        const tagName = node.tagName;

        if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tagName)) {
          headings.push({
            id: node.properties.id?.toString() ?? "",
            text: toString(node),
            level: Number.parseInt(tagName.charAt(1), 10),
          });
        }
      });
    })
    .use(rehypeShiki, {
      themes: {
        light: "github-light",
        dark: "tokyo-night",
      },
    })
    .use(rehypeStringify)
    .process(content);

  return {
    html: String(result),
    headings,
  };
}
