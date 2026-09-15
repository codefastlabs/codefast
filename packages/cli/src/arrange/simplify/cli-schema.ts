import * as z from "zod";

/**
 * The request payload for an `arrange simplify` run.
 *
 * @since 0.11.0
 */
export type ArrangeSimplifyRunRequest = {
  targetPath: string;
  write: boolean;
  foldVariantClassName?: boolean | undefined;
};

/**
 * The `zod` schema validating an `arrange simplify` run request.
 *
 * @since 0.11.0
 */
export const arrangeSimplifyRunRequestSchema: z.ZodType<ArrangeSimplifyRunRequest> = z.object({
  targetPath: z.string().min(1),
  write: z.boolean(),
  foldVariantClassName: z.boolean().optional(),
});
