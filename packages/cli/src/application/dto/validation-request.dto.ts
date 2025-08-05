import { z } from "zod";

export const ValidationRequestSchema = z.object({
  fix: z.boolean().default(false),
  includeWarnings: z.boolean().default(true),
  outputFormat: z.enum(["table", "json", "junit", "text"]).default("table"),
  path: z.string().min(1, "Path is required"),
  pattern: z.string().default("**/*.tsx"),
});

export type ValidationRequestDto = z.infer<typeof ValidationRequestSchema>;

export class ValidationRequest {
  constructor(
    public readonly path: string,
    public readonly pattern = "**/*.tsx",
    public readonly includeWarnings = true,
    public readonly outputFormat: "json" | "junit" | "table" | "text" = "table",
    public readonly fix = false,
  ) {}

  static create(dto: ValidationRequestDto): ValidationRequest {
    const validated = ValidationRequestSchema.parse(dto);

    return new ValidationRequest(
      validated.path,
      validated.pattern,
      validated.includeWarnings,
      validated.outputFormat,
      validated.fix,
    );
  }

  static fromCliArgs(args: {
    path?: string;
    pattern?: string;
    includeWarnings?: boolean;
    format?: string;
    fix?: boolean;
  }): ValidationRequest {
    return ValidationRequest.create({
      fix: args.fix || false,
      includeWarnings: args.includeWarnings ?? true,
      outputFormat: (args.format as any) || "table",
      path: args.path || process.cwd(),
      pattern: args.pattern || "**/*.tsx",
    });
  }
}
