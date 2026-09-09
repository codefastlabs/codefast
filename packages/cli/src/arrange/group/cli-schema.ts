import * as z from "zod";

/**
 * The request payload for `arrange group`.
 *
 * @since 0.3.16-canary.0
 */
export type ArrangeSuggestGroupsRequest = {
  inlineClasses: string;
  emitTvStyleArray: boolean;
  trailingClassName: boolean;
};

/**
 * The `zod` schema validating an `arrange group` request.
 *
 * @since 0.3.16-canary.0
 */
export const arrangeSuggestGroupsRequestSchema: z.ZodType<ArrangeSuggestGroupsRequest> = z.object({
  inlineClasses: z
    .string()
    .min(1, 'Pass a class string. Example: codefast arrange group "flex gap-2 text-sm rounded-md"'),
  emitTvStyleArray: z.boolean(),
  trailingClassName: z.boolean(),
});
