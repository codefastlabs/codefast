import { token } from "#/token";
import type { MetadataReader } from "#/metadata/metadata-types";
import type { Token } from "#/token";

/**
 * @since 0.3.16-canary.0
 */
export const MetadataReaderToken: Token<MetadataReader> = token<MetadataReader>("MetadataReader");
