import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeStringify from 'rehype-stringify';
import { codeToHtml } from 'shiki';
import { visit } from 'unist-util-visit';
import { toString } from 'hast-util-to-string';

export type MarkdownHeading = {
  id: string;
  text: string;
  level: number;
};

export type MarkdownResult = {
  markup: string;
  headings: MarkdownHeading[];
};

export async function renderMarkdown(content: string): Promise<MarkdownResult> {
  const headings: MarkdownHeading[] = [];

  const result = await unified()
    .use(remarkParse) // Parse markdown
    .use(remarkGfm) // Support GitHub Flavored Markdown
    .use(remarkRehype, { allowDangerousHtml: true }) // Convert to HTML AST
    .use(rehypeRaw) // Process raw HTML in markdown
    .use(rehypeSlug) // Add IDs to headings
    .use(rehypeAutolinkHeadings, {
      behavior: 'wrap',
      properties: { className: ['anchor'] },
    })
    .use(() => (tree) => {
      // Extract headings for table of contents
      visit(tree, 'element', (node: any) => {
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(node.tagName)) {
          headings.push({
            id: node.properties?.id || '',
            text: toString(node),
            level: parseInt(node.tagName.charAt(1), 10),
          });
        }
      });
    })
    .use(rehypeStringify) // Serialize to HTML string
    .process(content);

  return {
    markup: String(result),
    headings,
  };
}

/**
 * Highlights code using Shiki with light/dark theme support.
 */
export async function highlightCode(code: string, language: string): Promise<string> {
  return codeToHtml(code, {
    lang: language,
    themes: {
      light: 'github-light',
      dark: 'tokyo-night',
    },
  });
}
