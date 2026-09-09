import * as z from "zod";

/**
 * The request payload for an `arrange simplify` run.
 */
export type ArrangeSimplifyRunRequest = {
  targetPath: string;
  write: boolean;
};

/**
 * The `zod` schema validating an `arrange simplify` run request.
 */
export const arrangeSimplifyRunRequestSchema: z.ZodType<ArrangeSimplifyRunRequest> = z.object({
  targetPath: z.string().min(1),
  write: z.boolean(),
});
