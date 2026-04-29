import { token } from "#/token";
import type { MetadataReader } from "#/metadata/metadata-types";
import type { Token } from "#/token";

export const MetadataReaderToken: Token<MetadataReader> = token<MetadataReader>("MetadataReader");
