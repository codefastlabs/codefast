import path from "node:path";

import { z } from "zod";

import { codefastAuditRtlConfigSchema } from "#/core/config/schema";
import type { CodefastAuditRtlConfig } from "#/core/config/schema";

/**
 * Resolved request for a single RTL audit run.
 */
export type RtlAuditRunRequest = {
  readonly rootDir: string;
  readonly targetPath: string;
  readonly allowlist?: ReadonlyArray<string> | undefined;
  readonly json: boolean;
  readonly config: CodefastAuditRtlConfig;
};

/**
 * Zod schema for {@link RtlAuditRunRequest}.
 */
export const rtlAuditRunRequestSchema: z.ZodType<RtlAuditRunRequest> = z.object({
  rootDir: z.string().min(1),
  targetPath: z.string().min(1),
  allowlist: z.array(z.string()).optional(),
  json: z.boolean(),
  config: codefastAuditRtlConfigSchema,
});

/**
 * Resolve a path that may be absolute or relative to `rootDir`.
 */
export function resolveRepoRelativePath(rootDir: string, maybeRelative: string): string {
  return path.isAbsolute(maybeRelative) ? path.resolve(maybeRelative) : path.resolve(rootDir, maybeRelative);
}
