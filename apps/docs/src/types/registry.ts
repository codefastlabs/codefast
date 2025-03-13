import { z } from 'zod';

export const registryItemTypeSchema = z.enum([
  'registry:lib',
  'registry:block',
  'registry:component',
  'registry:ui',
  'registry:hook',
  'registry:page',
  'registry:file',

  // Internal use only
  'registry:theme',
  'registry:example',
  'registry:style',
  'registry:internal',
]);

export const registryItemFileSchema = z.discriminatedUnion('type', [
  // Target is required for registry:file and registry:page
  z.object({
    path: z.string(),
    content: z.string().optional(),
    type: z.enum(['registry:file', 'registry:page']),
    target: z.string(),
  }),
  z.object({
    path: z.string(),
    content: z.string().optional(),
    type: registryItemTypeSchema.exclude(['registry:file', 'registry:page']),
    target: z.string().optional(),
  }),
]);

export const registryItemSchema = z.object({
  name: z.string(),
  type: registryItemTypeSchema,
  title: z.string().optional(),
  author: z.string().min(2).optional(),
  description: z.string().optional(),
  files: z.array(registryItemFileSchema).optional(),
  categories: z.array(z.string()).optional(),
});

export type RegistryItem = z.infer<typeof registryItemSchema>;

export const registrySchema = z.object({
  name: z.string(),
  items: z.array(registryItemSchema),
});

export type Registry = z.infer<typeof registrySchema>;
