import { token } from "#/core/token";
import type { Token } from "#/core/token";
import type { MetadataReader } from "#/metadata/metadata-types";

/**
 * The token a custom `MetadataReader` is bound to for a container to pick up.
 *
 * @since 0.3.16-canary.0
 */
export const MetadataReaderToken: Token<MetadataReader> = token<MetadataReader>("MetadataReader");
