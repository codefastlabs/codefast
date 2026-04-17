import { defineCollection, defineConfig } from "@content-collections/core";
import { z } from "zod";
import { renderMarkdown } from "#/utils/markdown.ts";

/**
 * Docs collection for documentation pages.
 * Uses frontmatter parser to extract metadata and content.
 * Markdown is rendered to HTML at build-time with syntax highlighting.
 */
const docs = defineCollection({
  name: "docs",
  directory: "./src/content/docs",
  include: "**/*.md",
  parser: "frontmatter",
  schema: z.object({
    content: z.string(),
    description: z.string().optional(),
    headerImage: z.string().optional(),
    order: z.number().default(999),
    title: z.string(),
  }),
  transform: async (document) => {
    // Extract header image from content if not provided in frontmatter
    const headerImageMatch = document.content.match(/!\[([^\]]*)]\(([^)]+)\)/);
    const extractedHeaderImage = headerImageMatch ? headerImageMatch[2] : undefined;

    // Render markdown to HTML at build-time
    const { html, headings } = await renderMarkdown(document.content);

    return {
      _meta: document._meta,
      content: document.content,
      description: document.description,
      headerImage: document.headerImage ?? extractedHeaderImage,
      headings,
      html,
      order: document.order,
      slug: document._meta.path,
      title: document.title,
    };
  },
});

export default defineConfig({
  content: [docs],
});
