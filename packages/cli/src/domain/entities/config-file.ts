import { z } from "zod";

export const ConfigFileSchema = z.object({
  path: z.string().describe("Relative path to the configuration file"),
  content: z.string().describe("Content of the configuration file"),
  description: z.string().optional().describe("Description of the configuration file's purpose"),
});

export const ConfigCategorySchema = z.array(ConfigFileSchema).describe("Array of configuration files for a category");

export const ConfigGroupsSchema = z
  .record(z.string(), ConfigCategorySchema)
  .describe("Configuration groups by category");

export type ConfigFile = z.infer<typeof ConfigFileSchema>;

export type ConfigGroups = z.infer<typeof ConfigGroupsSchema>;
