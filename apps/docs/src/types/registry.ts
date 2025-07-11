import { z } from "zod";

import type { ComponentType } from "react";

export const componentTypeSchema = z.custom<ComponentType>((component) => typeof component === "function", {
  message: "Expected a valid React component",
});

export const registryItemTypeSchema = z.enum([
  "registry:block",
  "registry:component",
  "registry:page",
  "registry:file",
]);

export const registryItemFileSchema = z.object({
  content: z.string().optional(),
  highlightedContent: z.string().optional(),
  path: z.string(),
  target: z.string().optional(),
  type: registryItemTypeSchema,
});

export const registryItemSchema = z.object({
  component: componentTypeSchema,
  description: z.string(),
  files: z.array(registryItemFileSchema).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
  slug: z.string(),
  title: z.string(),
});

export const registryGroupSchema = z.object({
  title: z.string(),
  components: z.array(registryItemSchema).optional(),
  description: z.string().optional(),
  slug: z.string().optional(),
});

export type RegistryItem = z.infer<typeof registryItemSchema>;
export type RegistryGroup = z.infer<typeof registryGroupSchema>;
export type RegistryItemType = z.infer<typeof registryItemTypeSchema>;
export type RegistryItemFile = z.infer<typeof registryItemFileSchema>;
