import { defineCollection, defineConfig } from '@content-collections/core';
import { z } from 'zod';

/**
 * Docs collection for documentation pages.
 * Uses frontmatter parser to extract metadata and content.
 */
const docs = defineCollection({
  name: 'docs',
  directory: './src/content/docs',
  include: '**/*.md',
  parser: 'frontmatter',
  schema: z.object({
    title: z.string(),
    content: z.string(),
    description: z.string().optional(),
    order: z.number().default(999),
    headerImage: z.string().optional(),
  }),
  transform: (document) => {
    // Extract header image from content if not provided in frontmatter
    const headerImageMatch = document.content.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    const extractedHeaderImage = headerImageMatch ? headerImageMatch[2] : undefined;

    return {
      ...document,
      slug: document._meta.path,
      headerImage: document.headerImage ?? extractedHeaderImage,
    };
  },
});

export default defineConfig({
  collections: [docs],
});

/**
 * Exported type for use in components.
 * Represents a single documentation page with all transformed properties.
 */
export type Doc = z.infer<typeof docs.schema> & {
  slug: string;
  headerImage?: string;
  _meta: {
    path: string;
    fileName: string;
    directory: string;
    filePath: string;
    extension: string;
  };
  content: string;
};
