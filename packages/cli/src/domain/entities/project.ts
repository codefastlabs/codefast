import { z } from "zod";

/**
 * Schema for validating project configuration.
 * Ensures the project name is URL-friendly, not reserved, and the directory is valid.
 */
export const projectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name cannot be empty")
    .max(100, "Project name is too long (maximum 100 characters)")
    .regex(/^[a-z0-9-~][a-z0-9-._~]*$/, {
      message:
        "Project name must be URL-friendly (letters, numbers, hyphens, underscores, dots; no @ or scoped packages)",
    })
    .refine((name) => name !== "." && name !== "..", {
      message: "Project name cannot be '.' or '..'",
    })
    .refine((name) => !/^(?<reserved>CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i.test(name), {
      message: "Project name is a reserved system name",
    }),
  directory: z.string().describe("Project directory path"),
  packageJsonExists: z.boolean().describe("Whether package.json exists in the project directory"),
});

export type Project = z.infer<typeof projectSchema>;
