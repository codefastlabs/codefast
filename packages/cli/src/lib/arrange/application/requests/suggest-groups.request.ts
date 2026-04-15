import { z } from "zod";

export const ArrangeSuggestGroupsRequestSchema = z.object({
  inlineClasses: z
    .string()
    .min(1, 'Pass a class string. Example: codefast arrange group "flex gap-2 text-sm rounded-md"'),
  emitTvStyleArray: z.boolean(),
  trailingClassName: z.boolean(),
});

export type ArrangeSuggestGroupsRequest = z.infer<typeof ArrangeSuggestGroupsRequestSchema>;
