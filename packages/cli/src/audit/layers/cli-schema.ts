import * as z from "zod";

/**
 * One layered package as the run reads it: its name, the absolute root the layers sit under, and the layers.
 *
 * @since 0.14.0
 */
export type LayersAuditPackage = {
  readonly name: string;
  readonly rootPath: string;
  readonly layers: ReadonlyArray<ReadonlyArray<string>>;
};

/**
 * Resolved request for a single layering audit run.
 *
 * @since 0.14.0
 */
export type LayersAuditRunRequest = {
  readonly rootDir: string;
  readonly targetPath: string;
  readonly allowlist?: ReadonlyArray<string> | undefined;
  readonly json: boolean;
  readonly packages: ReadonlyArray<LayersAuditPackage>;
};

/**
 * Zod schema for {@link LayersAuditRunRequest}.
 *
 * @since 0.14.0
 */
export const layersAuditRunRequestSchema: z.ZodType<LayersAuditRunRequest> = z.object({
  rootDir: z.string().min(1),
  targetPath: z.string().min(1),
  allowlist: z.array(z.string()).optional(),
  json: z.boolean(),
  packages: z.array(
    z.object({
      name: z.string().min(1),
      rootPath: z.string().min(1),
      layers: z.array(z.array(z.string().min(1))),
    }),
  ),
});
